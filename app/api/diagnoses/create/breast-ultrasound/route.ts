import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { processBreastUltrasound } from "@/lib/utils/gradio-client";

export async function POST(request: NextRequest) {
  try {
    const start = performance.now();
    const supabase = createServerSupabaseClient();

    const formData = await request.formData();

    // Extract form values
    const metadata = formData.get("metadata") as string;
    const patientMetadata = metadata ? JSON.parse(metadata) : {};

    const {
      patientName,
      patientId,
      ageRange,
      scanType,
      notes = "",
    } = patientMetadata;
    const userId = formData.get("userId") as string;

    const hospitalId = (formData.get("hospitalId") as string) || userId;

    if (!patientName || !patientId || !ageRange || !scanType) {
      return NextResponse.json(
        { error: "Missing required patient information" },
        { status: 400 }
      );
    }

    // Get image file
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Generate a unique ID for this diagnosis
    const diagnosisId = uuidv4();

    // Step 1: Convert File to Blob for processing
    const imageBlob = new Blob([await imageFile.arrayBuffer()], {
      type: imageFile.type,
    });

    // Step 2: Process the image with the breast ultrasound model
    const aiResult: {
      success: boolean;
      data?: any;
      modelType: string;
      error?: string;
      resultImage?: Blob | string;
    } = await processBreastUltrasound(imageBlob);
    let confidence = aiResult.data[2] || null;
    let classification = aiResult.data[3] || null;
    const imageUrls = [];

    if (Array.isArray(aiResult.data)) {
      // Step 1: Process and upload the result images
      for (let i = 0; i < aiResult.data.length; i++) {
        const item = aiResult.data[i];

        // Check if the item has a valid image URL
        const fileUrl = item.url;
        if (!fileUrl) continue;

        // Fetch the image from the URL
        const response = await fetch(fileUrl);
        const blob = await response.blob();

        // Create a unique file name for each image
        const fileName = `${diagnosisId}/ai-result-${Date.now()}-${i}.webp`;

        // Step 2: Upload the image to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("diagnosis-images")
          .upload(fileName, blob, {
            contentType: "image/webp",
          });

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          continue;
        }

        // Step 3: Retrieve the public URL of the uploaded image
        const { data: publicUrlData } = await supabase.storage
          .from("diagnosis-images")
          .getPublicUrl(fileName);

        // Push the public URL to the imageUrls array
        if (publicUrlData?.publicUrl) {
          imageUrls.push(publicUrlData.publicUrl);
        }

        // Optional: Collect per-image metadata for detailed analysis
        const isAbnormal = item?.label === "Malignant"; // Example of setting a label
        const imageAnalysis = {
          imageUrl: publicUrlData?.publicUrl,
          label: isAbnormal ? "Malignant" : "Benign", // Example classification
          confidence: item?.confidence || null,
        };
      }
    }

    const end = performance.now();
    const durationMs = end - start;

    if (!aiResult.success) {
      return NextResponse.json(
        { error: aiResult.error || "Failed to process breast ultrasound" },
        { status: 500 }
      );
    }

    // Step 3: Store the original image in Supabase Storage

    let processedImageUrl = null;

    // Step 5: Prepare AI analysis results
    const aiAnalysisResults = {
      model_type: "breast-ultrasound",
      model_name: "breast-cancer-detection-ultrasound",
      overall_summary: classification || "Breast ultrasound analysis completed",
      classification: classification || "No classification provided",
      confidence: confidence || null,
      lesion_details: aiResult.data?.lesion_details || {},
      processed_image_url: processedImageUrl,
      analysis_timestamp: new Date().toISOString(),
    };

    // Step 6: Store in Supabase database
    const { data: diagnosis, error: dbError } = await supabase
      .from("diagnoses")
      .insert({
        id: diagnosisId,
        title: `Breast Ultrasound - ${patientName}`,
        patient_id: patientId,
        doctor_notes: notes,
        image_links: imageUrls,
        ai_analysis_results: aiAnalysisResults,
        user_id: userId,
        hospital_id: hospitalId,
        patient_metadata: {
          name: patientName,
          age_range: ageRange,
          scan_type: "Breast Ultrasound",
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error creating diagnosis record:", dbError);
      return NextResponse.json(
        { error: "Failed to create diagnosis record" },
        { status: 500 }
      );
    }

    // Return success response with diagnosis ID and details
    return NextResponse.json({
      success: true,
      diagnosisId,
      imageUrls,
      aiAnalysisResults,
    });
  } catch (error) {
    console.error("Error in breast ultrasound processing endpoint:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
