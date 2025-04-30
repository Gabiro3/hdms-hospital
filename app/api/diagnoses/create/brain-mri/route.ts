import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { processBrainMRI, BrainMRIResult } from "@/lib/utils/gradio-client"

export const maxDuration = 300 // Set max duration to 5 minutes for large image processing

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const supabase = createServerSupabaseClient()

    // Extract form values
    const metadata = formData.get("metadata") as string
    const patientMetadata = metadata ? JSON.parse(metadata) : {}

    const { patientName, patientId, ageRange, scanType, notes = "" } = patientMetadata
    const userId = formData.get("userId") as string

    const hospitalId = (formData.get("hospitalId") as string) || userId

    if (!patientName || !patientId || !ageRange || !scanType) {
      return NextResponse.json({ error: "Missing required patient information" }, { status: 400 })
    }

    // Get image file
    const imageFile = formData.get("image") as File | null

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Generate a unique ID for this diagnosis
    const diagnosisId = uuidv4()

    // Step 1: Convert File to Blob for processing
    const imageBlob = new Blob([await imageFile.arrayBuffer()], { type: imageFile.type })

    // Step 2: Process the image with the brain MRI model
    console.log("Processing brain MRI image...")
    const aiResult: BrainMRIResult = await processBrainMRI(imageBlob)
    console.log("AI Result:", aiResult)

    if (!aiResult.success) {
      return NextResponse.json({ error: aiResult.error || "Failed to process brain MRI" }, { status: 500 })
    }

    const imageUrls: string[] = []
    let processedImageUrl = null

    // Step 3: Fetch and store the result image
    if (aiResult.data[0]?.url) {
      try {
        const resultImageUrl = aiResult.data[0].url
        console.log("Downloading image from URL:", resultImageUrl)

        const response = await fetch(resultImageUrl)
        const resultImageBlob = await response.blob()

        const processedFileName = `${diagnosisId}/processed-${Date.now()}.webp`

        const { error: processedUploadError } = await supabase.storage
          .from("diagnosis-images")
          .upload(processedFileName, resultImageBlob, {
            contentType: "image/webp",
          })

        if (processedUploadError) {
          console.error("Error uploading processed image:", processedUploadError)
        } else {
          const { data: processedUrlData } = await supabase.storage
            .from("diagnosis-images")
            .getPublicUrl(processedFileName)

          processedImageUrl = processedUrlData.publicUrl
          imageUrls.push(processedImageUrl)
        }
      } catch (error) {
        console.error("Error processing result image:", error)
      }
    }

    // Step 4: Prepare AI analysis results
    const confidence = aiResult.data[2] || null
    const computationTime = aiResult.data[3] || null
    const label = aiResult.data[1]?.label || "Unknown"

    const aiAnalysisResults = {
      model_type: "brain-mri",
      model_name: aiResult.modelType || "mri-brain-cancer-detection",
      overall_summary: `${label.toUpperCase()} (Confidence: ${confidence ? confidence.toFixed(2) : "N/A"}%)`,
      label,
      confidence,
      computation_time: computationTime,
      processed_image_url: processedImageUrl,
      analysis_timestamp: new Date().toISOString(),
    }

    // Step 5: Store in Supabase database
    console.log("Creating diagnosis record in database...")
    const { data: diagnosis, error: dbError } = await supabase
      .from("diagnoses")
      .insert({
        id: diagnosisId,
        title: `Brain MRI - ${patientName}`,
        patient_id: patientId,
        doctor_notes: notes,
        image_links: imageUrls,
        ai_analysis_results: aiAnalysisResults,
        user_id: userId,
        hospital_id: hospitalId,
        patient_metadata: {
          name: patientName,
          age_range: ageRange,
          scan_type: "Brain MRI",
        },
      })
      .select()
      .single()

    if (dbError) {
      console.error("Error creating diagnosis record:", dbError)
      return NextResponse.json({ error: "Failed to create diagnosis record" }, { status: 500 })
    }

    // Return success response with diagnosis ID and details
    return NextResponse.json({
      success: true,
      diagnosisId,
      imageUrls,
      aiAnalysisResults,
    })
  } catch (error) {
    console.error("Error in brain MRI processing endpoint:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
