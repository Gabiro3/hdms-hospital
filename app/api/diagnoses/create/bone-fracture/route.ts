import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import {  ChestXrayResult, processBoneFracture } from "@/lib/utils/gradio-client"


export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const formData = await request.formData()

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
    const aiResult: ChestXrayResult = await processBoneFracture(imageBlob)

    if (!aiResult.success) {
      return NextResponse.json({ error: aiResult.error || "Failed to process bone fracture" }, { status: 500 })
    }

    const imageUrls = []
    let processedImageUrl = null

    // Step 3: Process the disease findings from the AI result
    // Step 3: Extract prediction and confidence from AI result
const label = aiResult.data[1] || 'Unknown'
const confidenceStr = aiResult.data[2] || '0%'
const confidence = parseFloat(confidenceStr.replace('%', '')) || 0

const diseasesWithConfidence = [{
  disease: label,
  confidence,
}]


    // Step 4: Download and store the result image
    let originalImageUrl = aiResult.data[0]?.url
    let originalImageBlob: Blob | null = null

    if (originalImageUrl && originalImageUrl.startsWith("http")) {
      const response = await fetch(originalImageUrl)
      originalImageBlob = await response.blob()

      const originalFileName = `${diagnosisId}/original-${Date.now()}.webp`

      const { error: originalUploadError } = await supabase.storage
        .from("diagnosis-images")
        .upload(originalFileName, originalImageBlob, {
          contentType: "image/webp",
        })

      if (originalUploadError) {
        console.error("Error uploading original image:", originalUploadError)
      } else {
        const { data: originalUrlData } = await supabase.storage
          .from("diagnosis-images")
          .getPublicUrl(originalFileName)

        imageUrls.push(originalUrlData.publicUrl)
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
      }      


    // Step 6: Store in Supabase database
    console.log("Creating diagnosis record in database...")
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
    console.error("Error in Xray Bone-Fracture processing endpoint:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
