import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { Client } from "@gradio/client"
import { FileEdit } from "lucide-react"

const GRADIO_APP_ID = process.env.GRADIO_APP_ID || "pb01/healthlink-beta"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const formData = await request.formData()
    const metadata = formData.get("metadata") as string
    const patientMetadata = metadata ? JSON.parse(metadata) : {}

    const { patientName, patientId, ageRange, scanType, notes = "" } = patientMetadata

    // Extract form values
    const hospitalId = formData.get("hospitalId") as string
    const userId = formData.get("userId") as string

    if (!patientName || !patientId || !ageRange || !scanType || !hospitalId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get image files
    const imageFiles: File[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image") && value instanceof File && value.size > 0) {
        imageFiles.push(value)
      }
    }

    if (imageFiles.length === 0) {
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 })
    }

    const diagnosisId = uuidv4()

    // Step 1: Run AI Analysis on uploaded files
    let aiAnalysisResults
    const resultImageUrls: string[] = []

    try {
      const start = performance.now()

      const client = await Client.connect(GRADIO_APP_ID)

      const imageBlobs = await Promise.all(
        imageFiles.map(file =>
          file.arrayBuffer().then(buf => new Blob([buf], { type: file.type }))
        )
      )

      const result = await client.predict("/process_images", {
        image_list: imageBlobs,
      })

      const end = performance.now()
      const durationMs = end - start

      const aiImageResults = (result.data as { [key: number]: any[] })[0] || []
      const aiData = result.data as { [key: number]: any[] }
      const aiComment = aiData[2] || "No comment from AI"
      const perImageAnalysis = []

      // Step 2: Upload Gradio result images to Supabase
      for (let i = 0; i < aiImageResults.length; i++) {
        const res = aiImageResults[i]
        const fileUrl = res?.image?.url
        console.log(res)
        console.log(fileUrl)

        if (!fileUrl) continue

        const response = await fetch(fileUrl)
        const blob = await response.blob()

        const fileName = `${diagnosisId}/processed-${Date.now()}-${i}.webp`

        const { error: uploadError } = await supabase.storage
    .from("diagnosis-images")
    .upload(fileName, blob, {
      contentType: "image/webp",
    })

        if (uploadError) {
          console.error("Upload failed for processed image:", uploadError)
          continue
        }

        const { data: publicUrlData } = await supabase.storage
          .from("diagnosis-images")
          .getPublicUrl(fileName)

        const publicUrl = publicUrlData.publicUrl
        resultImageUrls.push(publicUrl)

        const isAbnormal = (result.data as { [key: number]: any[] })[2]?.includes("activation")

        perImageAnalysis.push({
          imageUrl: publicUrl,
          label: isAbnormal ? "Pneumonia Positive" : res.label,
          confidence: res.confidence,
        })
        console.log(perImageAnalysis)
      }

      // Step 3: Build analysis summary
      aiAnalysisResults = {
        overall_summary: aiComment,
        per_image: perImageAnalysis,
        analysis_duration_ms: Math.round(durationMs),
        analysisTimestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error calling AI analysis service:", error)
      aiAnalysisResults = {
        overall_summary: "AI analysis failed",
        per_image: [],
        analysis_duration_ms: 0,
        analysisTimestamp: new Date().toISOString(),
        error: "AI service unavailable",
      }
    }

    // Step 4: Store in Supabase
    const { data: diagnosis, error: dbError } = await supabase
      .from("diagnoses")
      .insert({
        id: diagnosisId,
        title: `${scanType} Scan - ${patientName}`,
        patient_id: patientId,
        doctor_notes: notes,
        image_links: resultImageUrls,
        ai_analysis_results: aiAnalysisResults,
        user_id: userId,
        hospital_id: hospitalId,
        patient_metadata: {
          name: patientName,
          age_range: ageRange,
          scan_type: scanType,
        },
      })
      .select()
      .single()

    if (dbError) {
      console.error("Error creating diagnosis record:", dbError)
      return NextResponse.json({ error: "Failed to create diagnosis record" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      diagnosis: {
        id: diagnosisId,
        imageUrls: resultImageUrls,
        aiAnalysisResults,
      },
    })
  } catch (error) {
    console.error("Error in create diagnosis API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
