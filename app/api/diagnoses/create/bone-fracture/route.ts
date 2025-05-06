import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  ChestXrayResult,
  processBoneFracture,
} from "@/lib/utils/gradio-client";

export async function POST(request: NextRequest) {
  try {
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
    const aiResult: ChestXrayResult = await processBoneFracture(imageBlob);

    if (!aiResult.success) {
      return NextResponse.json(
        { error: aiResult.error || "Failed to process bone fracture" },
        { status: 500 }
      );
    }

    let processedImageUrl = null;

    // Step 3: Extract prediction and confidence from AI result
    const label = aiResult.data[4] || "Unknown";
    const confidenceStr = aiResult.data[5] || "0%";
    const confidence = parseFloat(confidenceStr) || 0;

    const diseasesWithConfidence = [
      {
        disease: label,
        confidence,
      },
    ];

    // Step 4: Upload all 4 images from AI result
    const imageUrls: string[] = [];
    const imageLabels = ["original", "heatmap", "inverted", "isolated"];

    for (let i = 0; i < 4; i++) {
      const imageInfo = aiResult.data[i];
      if (!imageInfo?.url || !imageInfo.url.startsWith("http")) continue;

      try {
        const response = await fetch(imageInfo.url);
        const blob = await response.blob();

        const fileName = `${diagnosisId}/${imageLabels[i]}-${Date.now()}.webp`;
        const { error: uploadError } = await supabase.storage
          .from("diagnosis-images")
          .upload(fileName, blob, {
            contentType: "image/webp",
          });

        if (uploadError) {
          console.error(
            `Error uploading ${imageLabels[i]} image:`,
            uploadError
          );
          continue;
        }

        const { data: publicUrlData } = await supabase.storage
          .from("diagnosis-images")
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          imageUrls.push(publicUrlData.publicUrl);
        }
      } catch (err) {
        console.error(`Error processing ${imageLabels[i]} image:`, err);
      }
    }

    // Step 5: Prepare AI analysis results
    const aiAnalysisResults = {
      model_type: "bone-fracture",
      model_name: aiResult.modelType || "bone-fracture",
      prediction_label: label,
      confidence_score: confidence,
      overall_summary: `Predicted: ${label} (${confidence.toFixed(2)}%)`,
      processed_image_url: processedImageUrl,
      original_image_url: imageUrls.length > 0 ? imageUrls[0] : null,
      analysis_timestamp: new Date().toISOString(),
    };

    // Step 6: Store in Supabase database
    const { data: diagnosis, error: dbError } = await supabase
      .from("diagnoses")
      .insert({
        id: diagnosisId,
        title: `Bone Fracture - ${patientName}`,
        patient_id: patientId,
        doctor_notes: notes,
        image_links: imageUrls,
        ai_analysis_results: aiAnalysisResults,
        user_id: userId,
        hospital_id: hospitalId,
        patient_metadata: {
          name: patientName,
          age_range: ageRange,
          scan_type: "Bone Fracture",
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
    console.error("Error in Xray Bone-Fracture processing endpoint:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
