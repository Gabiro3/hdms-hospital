/**
 * Utility functions for printing and downloading with disclaimers
 */

// AI disclaimer text to be used across the application
export const AI_DISCLAIMER =
  "DISCLAIMER: This report contains AI-generated analysis which should be reviewed by a qualified medical professional. " +
  "The AI results are provided as a supplementary tool and should not be used as the sole basis for medical decisions."

  export const AI_IMAGE_DISCLAIMER =
  "DISCLAIMER: This image is AI-generated."

/**
 * Prepares the page for printing a diagnosis
 * @param diagnosisId The ID of the diagnosis to print
 */
export function printDiagnosis(diagnosisId: string) {
  // Store the current body content
  const originalContent = document.body.innerHTML

  // Get the diagnosis content
  const diagnosisElement = document.getElementById(`diagnosis-print-${diagnosisId}`)

  if (!diagnosisElement) {
    console.error("Diagnosis element not found")
    return
  }

  // Replace body content with just the diagnosis
  document.body.innerHTML = diagnosisElement.innerHTML

  // Add the disclaimer at the top
  const disclaimer = document.createElement("div")
  disclaimer.className = "print-disclaimer"
  disclaimer.innerHTML = `
    <div style="border: 2px solid #f43f5e; padding: 10px; margin-bottom: 20px; background-color: #fff1f2; color: #881337; font-weight: bold;">
      ${AI_DISCLAIMER}
    </div>
  `
  document.body.insertBefore(disclaimer, document.body.firstChild)

  // Print the page
  window.print()

  // Restore the original content
  document.body.innerHTML = originalContent
}

/**
 * Adds a disclaimer watermark to an image
 * @param imageUrl The URL of the image
 * @param text The disclaimer text
 * @returns A Promise that resolves to a data URL of the image with watermark
 */
export function addDisclaimerToImage(imageUrl: string, text: string = AI_IMAGE_DISCLAIMER): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous" // Important to avoid CORS issues
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      // Set canvas dimensions to match the image
      canvas.width = img.width
      canvas.height = img.height

      // Draw the original image
      ctx.drawImage(img, 0, 0)

      // Add semi-transparent overlay at the bottom
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, canvas.height - 40, canvas.width, 40)

      // Add disclaimer text
      ctx.fillStyle = "white"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Split text into multiple lines if needed
      const maxWidth = canvas.width - 20
      const words = text.split(" ")
      let line = ""
      const lines = []

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " "
        const metrics = ctx.measureText(testLine)

        if (metrics.width > maxWidth && i > 0) {
          lines.push(line)
          line = words[i] + " "
        } else {
          line = testLine
        }
      }
      lines.push(line)

      // Draw each line
      const lineHeight = 15
      const startY = canvas.height - 30 + (lineHeight * (lines.length - 1)) / 2

      lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight)
      })

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
      resolve(dataUrl)
    }

    img.onerror = () => {
      reject(new Error("Failed to load image"))
    }

    img.src = imageUrl
  })
}

/**
 * Downloads an image with a disclaimer watermark
 * @param imageUrl The URL of the image to download
 * @param filename The filename to use for the download
 */
export async function downloadImageWithDisclaimer(imageUrl: string, filename: string) {
  try {
    const imageWithDisclaimer = await addDisclaimerToImage(imageUrl)

    // Create a temporary link element
    const link = document.createElement("a")
    link.href = imageWithDisclaimer
    link.download = filename || "diagnosis-image.jpeg"

    // Append to the document, click it, and remove it
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error("Error downloading image with disclaimer:", error)
  }
}

/**
 * Downloads multiple images with disclaimers as a zip file
 * @param imageUrls Array of image URLs to download
 * @param zipFilename The filename for the zip file
 */
export async function downloadMultipleImagesWithDisclaimer(imageUrls: string[], zipFilename: string) {
  // For simplicity, we'll just download them one by one
  // In a real implementation, you would use a library like JSZip to create a zip file

  for (let i = 0; i < imageUrls.length; i++) {
    const filename = `diagnosis-image-${i + 1}.jpeg`
    await downloadImageWithDisclaimer(imageUrls[i], filename)
  }
}
