import { Client } from "@gradio/client"

// Cache for Gradio clients to avoid creating multiple instances
const clientCache: Record<string, any> = {}

// Available Gradio models
export const GRADIO_MODELS = {
  BRAIN_MRI: "pb01/mri-brain-cancer-detection",
  CHEST_XRAY: "pb01/chest-multi-scanner-14",
  BREAST_ULTRASOUND: "pb01/breast-cancer-detection-ultrasound",
  GENERAL: "pb01/healthlink-beta", // Original general model
}
export interface BrainMRIResult {
  success: boolean;
  data?: any;
  modelType: string;
  error?: string;
  resultImage?: Blob | string;
}
export interface ChestXrayResult {
  success: boolean;
  data?: any;
  modelType: string;
  resultImage?: Blob | string;
  error?: string;
}

/**
 * Get or create a Gradio client for a specific model
 * @param modelId The Gradio model ID to connect to
 * @returns A connected Gradio client
 */
export async function getGradioClient(modelId: string) {
  if (!clientCache[modelId]) {
    try {
      clientCache[modelId] = await Client.connect(modelId)
      console.log(`Connected to Gradio model: ${modelId}`)
    } catch (error) {
      console.error(`Failed to connect to Gradio model ${modelId}:`, error)
      throw new Error(
        `Failed to connect to medical analysis service: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  return clientCache[modelId]
}

/**
 * Process brain MRI images
 * @param imageBlob The image blob to process
 * @returns The processing result
 */
export async function processBrainMRI(imageBlob: Blob) {
  try {
    const client = await getGradioClient(GRADIO_MODELS.BRAIN_MRI)

    const result = await client.predict("/predict", {
      img: imageBlob,
    })

    return {
      success: true,
      data: result.data,
      modelType: "brain-mri",
    }
  } catch (error) {
    console.error("Error processing brain MRI with Gradio:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      modelType: "brain-mri",
    }
  }
}

/**
 * Process chest X-ray images
 * @param imageBlob The image blob to process
 * @returns The processing result
 */
export async function processChestXray(imageBlob: Blob) {
  try {
    const client = await getGradioClient(GRADIO_MODELS.CHEST_XRAY)

    const result = await client.predict("/predict", {
      image: imageBlob,
    })

    return {
      success: true,
      data: result.data,
      modelType: "chest-xray",
    }
  } catch (error) {
    console.error("Error processing chest X-ray with Gradio:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      modelType: "chest-xray",
    }
  }
}

/**
 * Process breast ultrasound images
 * @param imageBlob The image blob to process
 * @returns The processing result
 */
export async function processBreastUltrasound(imageBlob: Blob) {
  try {
    const client = await getGradioClient(GRADIO_MODELS.BREAST_ULTRASOUND)

    const result = await client.predict("/predict", {
      input_image: imageBlob,
    })
    console.log(result.data)

    return {
      success: true,
      data: result.data,
      modelType: "breast-ultrasound",
    }
  } catch (error) {
    console.error("Error processing breast ultrasound with Gradio:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      modelType: "breast-ultrasound",
    }
  }
}

/**
 * Process images using the general model (original implementation)
 * @param imageBlob The image blob to process
 * @returns The processing result
 */
export async function processGeneralImages(imageBlob: Blob) {
  try {
    const client = await getGradioClient(GRADIO_MODELS.GENERAL)

    const result = await client.predict("/process_images", {
      image_list: imageBlob,
    })

    return {
      success: true,
      data: result.data,
      modelType: "general",
    }
  } catch (error) {
    console.error("Error processing images with general Gradio model:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      modelType: "general",
    }
  }
}
