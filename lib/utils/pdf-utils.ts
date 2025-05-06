import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { format } from "date-fns"
import { formatCurrency } from "./billing-utils"

/**
 * Generate a PDF from an invoice and download it
 * @param invoice The invoice object to generate a PDF for
 */
export async function generateInvoicePDF(invoice: any): Promise<void> {
  try {
    // Create a temporary container for the invoice content
    const container = document.createElement("div")
    container.style.position = "absolute"
    container.style.left = "-9999px"
    container.style.top = "-9999px"
    container.style.width = "800px" // Fixed width for better PDF quality
    document.body.appendChild(container)

    // Render the invoice content
    container.innerHTML = generateInvoiceHTML(invoice)

    // Wait for any images to load
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Convert the HTML to a canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      allowTaint: true,
    })

    // Add the canvas to the PDF
    const imgData = canvas.toDataURL("image/png")
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 0

    pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)

    // If the content is too long, add more pages
    if (imgHeight * ratio > pdfHeight) {
      let remainingHeight = imgHeight * ratio
      let currentPosition = pdfHeight

      while (remainingHeight > pdfHeight) {
        pdf.addPage()
        pdf.addImage(imgData, "PNG", imgX, -currentPosition, imgWidth * ratio, imgHeight * ratio)
        remainingHeight -= pdfHeight
        currentPosition += pdfHeight
      }
    }

    // Download the PDF
    pdf.save(`Invoice-${invoice.invoice_number}.pdf`)

    // Clean up
    document.body.removeChild(container)
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Failed to generate PDF")
  }
}

/**
 * Generate HTML content for the invoice PDF
 * @param invoice The invoice object
 * @returns HTML string for the invoice
 */
function generateInvoiceHTML(invoice: any): string {
  const details = invoice.details || {}
  const hospitalName = details.hospitalName || invoice.hospitals?.name || "Unknown Hospital"
  const hospitalAddress = details.hospitalAddress || invoice.hospitals?.address || ""
  const diagnoses = details.diagnoses || []

  // Group diagnoses by type
  const diagnosisByType: Record<string, { count: number; cost: number }> = {}
  diagnoses.forEach((diagnosis: any) => {
    const type = diagnosis.diagnosisType || "Other"
    if (!diagnosisByType[type]) {
      diagnosisByType[type] = { count: 0, cost: 0 }
    }
    diagnosisByType[type].count += 1
    diagnosisByType[type].cost += diagnosis.cost || 0
  })

  // Generate diagnosis rows
  let diagnosisRows = ""
  Object.entries(diagnosisByType).forEach(([type, data]) => {
    diagnosisRows += `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${type}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${data.count}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${formatCurrency(data.cost / data.count)}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatCurrency(data.cost)}</td>
      </tr>
    `
  })

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <!-- Letterhead -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="display: flex; align-items: center;">
          <div style="background-color: #2563eb; color: white; padding: 12px; border-radius: 8px; margin-right: 12px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
          <div>
            <h2 style="font-size: 24px; font-weight: bold; margin: 0;">INVOICE</h2>
            <p style="color: #6b7280; margin: 0;">${invoice.invoice_number}</p>
          </div>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: bold; margin: 0;">Healthlink Rwanda HDMS</p>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">KN 5 Rd, Kigali</p>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">Rwanda</p>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">info@healthlinkrwanda.org</p>
        </div>
      </div>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

      <!-- Bill To -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Bill To:</p>
          <p style="font-weight: bold; margin: 0;">${hospitalName}</p>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">${hospitalAddress}</p>
        </div>
        <div style="text-align: right;">
          <div style="margin-bottom: 5px;">
            <span style="color: #6b7280; font-size: 14px;">Invoice Date:</span>
            <span style="font-size: 14px; margin-left: 10px;">${format(new Date(invoice.created_at), "MMMM d, yyyy")}</span>
          </div>
          <div style="margin-bottom: 5px;">
            <span style="color: #6b7280; font-size: 14px;">Billing Period:</span>
            <span style="font-size: 14px; margin-left: 10px;">
              ${format(new Date(invoice.start_date), "MMMM d")} - ${format(new Date(invoice.end_date), "MMMM d, yyyy")}
            </span>
          </div>
          <div>
            <span style="color: #6b7280; font-size: 14px;">Status:</span>
            <span style="font-size: 14px; font-weight: bold; color: #2563eb; margin-left: 10px;">${invoice.status.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <!-- Invoice Summary -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Diagnosis Type</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Quantity</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Unit Price</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${diagnosisRows}
        </tbody>
      </table>

      <!-- Invoice Total -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <p style="font-weight: 500; margin: 0;">Subtotal:</p>
            <p style="margin: 0;">${formatCurrency(invoice.total_amount)}</p>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <p style="font-weight: 500; margin: 0;">Tax (0%):</p>
            <p style="margin: 0;">${formatCurrency(0)}</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 10px 0;" />
          <div style="display: flex; justify-content: space-between; font-size: 18px;">
            <p style="font-weight: bold; margin: 0;">Total:</p>
            <p style="font-weight: bold; margin: 0;">${formatCurrency(invoice.total_amount)}</p>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
        <p style="font-weight: 500; margin: 0 0 5px 0;">Notes:</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          Payment is due within 30 days of invoice date. Please make payment to Healthlink Rwanda HDMS.
          Thank you for your business.
        </p>
      </div>
    </div>
  `
}

/**
 * Generate a PDF from patient data and download it
 * @param patient The patient object to generate a PDF for
 */
export async function generatePatientPDF(patient: any): Promise<void> {
  try {
    // Create a temporary container for the patient content
    const container = document.createElement("div")
    container.style.position = "absolute"
    container.style.left = "-9999px"
    container.style.top = "-9999px"
    container.style.width = "800px" // Fixed width for better PDF quality
    document.body.appendChild(container)

    // Render the patient content
    container.innerHTML = generatePatientHTML(patient)

    // Wait for any images to load
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Convert the HTML to a canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      allowTaint: true,
    })

    // Add the canvas to the PDF
    const imgData = canvas.toDataURL("image/png")
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 0

    pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)

    // If the content is too long, add more pages
    if (imgHeight * ratio > pdfHeight) {
      let remainingHeight = imgHeight * ratio
      let currentPosition = pdfHeight

      while (remainingHeight > pdfHeight) {
        pdf.addPage()
        pdf.addImage(imgData, "PNG", imgX, -currentPosition, imgWidth * ratio, imgHeight * ratio)
        remainingHeight -= pdfHeight
        currentPosition += pdfHeight
      }
    }

    // Download the PDF
    pdf.save(`Patient-${patient.id}.pdf`)

    // Clean up
    document.body.removeChild(container)
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Failed to generate PDF")
  }
}

/**
 * Generate HTML content for the patient PDF
 * @param patient The patient object
 * @returns HTML string for the patient
 */
function generatePatientHTML(patient: any): string {
  // Format date of birth
  const formatDateOfBirth = () => {
    if (patient.patient_info?.demographics?.dateOfBirth) {
      return format(new Date(patient.patient_info.demographics.dateOfBirth), "MMMM d, yyyy")
    }
    return "Not recorded"
  }

  // Calculate age
  const calculateAge = () => {
    if (patient.patient_info?.demographics?.age) {
      return patient.patient_info.demographics.age
    }
    if (patient.patient_info?.demographics?.dateOfBirth) {
      const birthDate = new Date(patient.patient_info.demographics.dateOfBirth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    }
    return "Unknown"
  }

  // Generate visits rows
  let visitsRows = ""
  if (patient.visits && patient.visits.length > 0) {
    patient.visits.slice(0, 10).forEach((visit: any) => {
      visitsRows += `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${format(new Date(visit.visit_date), "MMM d, yyyy")}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${visit.reason}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${visit.users?.full_name || "Unknown"}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">
            ${visit.vitals ? `BP: ${visit.vitals.blood_pressure || "N/A"}, HR: ${visit.vitals.heart_rate || "N/A"}` : "Not recorded"}
          </td>
        </tr>
      `
    })
  } else {
    visitsRows = `
      <tr>
        <td colspan="4" style="padding: 10px; border: 1px solid #ddd; text-align: center;">No visits recorded</td>
      </tr>
    `
  }

  // Generate diagnoses rows
  let diagnosesRows = ""
  if (patient.diagnoses && patient.diagnoses.length > 0) {
    patient.diagnoses.slice(0, 10).forEach((diagnosis: any) => {
      diagnosesRows += `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${diagnosis.title}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${format(new Date(diagnosis.created_at), "MMM d, yyyy")}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${diagnosis.users?.full_name || "Unknown"}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">
            ${diagnosis.ai_analysis_results?.overall_summary ? diagnosis.ai_analysis_results.overall_summary.substring(0, 100) + "..." : "No analysis available"}
          </td>
        </tr>
      `
    })
  } else {
    diagnosesRows = `
      <tr>
        <td colspan="4" style="padding: 10px; border: 1px solid #ddd; text-align: center;">No diagnoses recorded</td>
      </tr>
    `
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <!-- Letterhead -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="display: flex; align-items: center;">
          <div style="background-color: #2563eb; color: white; padding: 12px; border-radius: 8px; margin-right: 12px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <div>
            <h2 style="font-size: 24px; font-weight: bold; margin: 0;">PATIENT RECORD</h2>
            <p style="color: #6b7280; margin: 0;">Healthlink Rwanda HDMS</p>
          </div>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: bold; margin: 0;">Healthlink Rwanda HDMS</p>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">KN 5 Rd, Kigali</p>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">Rwanda</p>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">info@healthlinkrwanda.org</p>
        </div>
      </div>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

      <!-- Patient Information -->
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Patient Information</h3>
        
        <div style="display: flex; flex-wrap: wrap; margin-bottom: 20px;">
          <div style="width: 50%; margin-bottom: 10px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Name:</p>
            <p style="font-weight: bold; margin: 0;">${patient.name || "Unknown"}</p>
          </div>
          <div style="width: 50%; margin-bottom: 10px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Patient ID:</p>
            <p style="font-weight: bold; margin: 0;">${patient.id}</p>
          </div>
          <div style="width: 50%; margin-bottom: 10px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Date of Birth:</p>
            <p style="font-weight: bold; margin: 0;">${formatDateOfBirth()}</p>
          </div>
          <div style="width: 50%; margin-bottom: 10px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Age:</p>
            <p style="font-weight: bold; margin: 0;">${calculateAge()}</p>
          </div>
          ${
            patient.patient_info?.demographics?.gender
              ? `
          <div style="width: 50%; margin-bottom: 10px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Gender:</p>
            <p style="font-weight: bold; margin: 0;">${patient.patient_info.demographics.gender.charAt(0).toUpperCase() + patient.patient_info.demographics.gender.slice(1)}</p>
          </div>
          `
              : ""
          }
          ${
            patient.patient_info?.medical?.bloodType && patient.patient_info.medical.bloodType !== "unknown"
              ? `
          <div style="width: 50%; margin-bottom: 10px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Blood Type:</p>
            <p style="font-weight: bold; margin: 0;">${patient.patient_info.medical.bloodType}</p>
          </div>
          `
              : ""
          }
        </div>

        ${
          patient.patient_info?.contact
            ? `
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 16px; margin-bottom: 10px;">Contact Information</h4>
          <div style="display: flex; flex-wrap: wrap;">
            ${
              patient.patient_info.contact.phone
                ? `
            <div style="width: 50%; margin-bottom: 10px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Phone:</p>
              <p style="margin: 0;">${patient.patient_info.contact.phone}</p>
            </div>
            `
                : ""
            }
            ${
              patient.patient_info.contact.email
                ? `
            <div style="width: 50%; margin-bottom: 10px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Email:</p>
              <p style="margin: 0;">${patient.patient_info.contact.email}</p>
            </div>
            `
                : ""
            }
            ${
              patient.patient_info.contact.address
                ? `
            <div style="width: 100%; margin-bottom: 10px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Address:</p>
              <p style="margin: 0;">${patient.patient_info.contact.address}</p>
            </div>
            `
                : ""
            }
          </div>
        </div>
        `
            : ""
        }

        ${
          patient.patient_info?.medical?.allergies
            ? `
        <div style="margin-bottom: 20px; padding: 10px; background-color: #fee2e2; border-radius: 4px;">
          <h4 style="font-size: 16px; margin: 0 0 5px 0; color: #b91c1c;">Allergies</h4>
          <p style="margin: 0; color: #b91c1c;">${patient.patient_info.medical.allergies}</p>
        </div>
        `
            : ""
        }

        ${
          patient.patient_info?.medical?.chronicConditions
            ? `
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 16px; margin-bottom: 5px;">Chronic Conditions</h4>
          <p style="margin: 0;">${patient.patient_info.medical.chronicConditions}</p>
        </div>
        `
            : ""
        }

        ${
          patient.patient_info?.emergency?.name
            ? `
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 16px; margin-bottom: 10px;">Emergency Contact</h4>
          <div style="display: flex; flex-wrap: wrap;">
            <div style="width: 50%; margin-bottom: 5px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Name:</p>
              <p style="margin: 0;">${patient.patient_info.emergency.name}</p>
            </div>
            ${
              patient.patient_info.emergency.relation
                ? `
            <div style="width: 50%; margin-bottom: 5px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Relationship:</p>
              <p style="margin: 0;">${patient.patient_info.emergency.relation}</p>
            </div>
            `
                : ""
            }
            ${
              patient.patient_info.emergency.phone
                ? `
            <div style="width: 50%; margin-bottom: 5px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Phone:</p>
              <p style="margin: 0;">${patient.patient_info.emergency.phone}</p>
            </div>
            `
                : ""
            }
          </div>
        </div>
        `
            : ""
        }
      </div>

      <!-- Recent Visits -->
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Recent Visits</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Date</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Reason</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Doctor</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Vitals</th>
            </tr>
          </thead>
          <tbody>
            ${visitsRows}
          </tbody>
        </table>
      </div>

      <!-- Recent Diagnoses -->
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Recent Diagnoses</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Title</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Date</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Doctor</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Analysis</th>
            </tr>
          </thead>
          <tbody>
            ${diagnosesRows}
          </tbody>
        </table>
      </div>

      <!-- Notes -->
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
        <p style="font-weight: 500; margin: 0 0 5px 0;">Notes:</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          This report was generated from Healthlink Rwanda HDMS on ${format(new Date(), "MMMM d, yyyy")} and contains
          confidential patient information. Please handle according to medical privacy regulations.
        </p>
      </div>
    </div>
  `
}

/**
 * Generate a PDF from a medical report and download it
 * @param report The report object to generate a PDF for
 */
export async function generateReportPDF(report: any): Promise<void> {
  try {
    // Create a temporary container for the report content
    const container = document.createElement("div")
    container.style.position = "absolute"
    container.style.left = "-9999px"
    container.style.top = "-9999px"
    container.style.width = "800px" // Fixed width for better PDF quality
    document.body.appendChild(container)

    // Render the report content
    container.innerHTML = generateReportHTML(report)

    // Wait for any images to load
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Convert the HTML to a canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      allowTaint: true,
    })

    // Add the canvas to the PDF
    const imgData = canvas.toDataURL("image/png")
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 0

    pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)

    // If the content is too long, add more pages
    if (imgHeight * ratio > pdfHeight) {
      let remainingHeight = imgHeight * ratio
      let currentPosition = pdfHeight

      while (remainingHeight > pdfHeight) {
        pdf.addPage()
        pdf.addImage(imgData, "PNG", imgX, -currentPosition, imgWidth * ratio, imgHeight * ratio)
        remainingHeight -= pdfHeight
        currentPosition += pdfHeight
      }
    }

    // Download the PDF
    pdf.save(`${report.title || "Medical-Report"}.pdf`)

    // Clean up
    document.body.removeChild(container)
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Failed to generate PDF")
  }
}

/**
 * Generate HTML content for the report PDF
 * @param report The report object
 * @returns HTML string for the report
 */
function generateReportHTML(report: any): string {
  // Format the report content based on type
  let reportContent = ""

  if (report.type === "SOAP") {
    reportContent = `
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 16px; margin-bottom: 10px;">Subjective</h4>
        <p style="margin: 0; white-space: pre-line;">${report.content.subjective || "No subjective information provided."}</p>
      </div>
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 16px; margin-bottom: 10px;">Objective</h4>
        ${
          report.content.objective.vitals
            ? `
        <div style="margin-bottom: 10px;">
          <h5 style="font-size: 14px; margin-bottom: 5px;">Vitals</h5>
          <p style="margin: 0;">
            ${report.content.objective.vitals.blood_pressure ? `BP: ${report.content.objective.vitals.blood_pressure}` : ""}
            ${report.content.objective.vitals.heart_rate ? `HR: ${report.content.objective.vitals.heart_rate} bpm` : ""}
            ${report.content.objective.vitals.temperature ? `Temp: ${report.content.objective.vitals.temperature}°C` : ""}
            ${report.content.objective.vitals.respiratory_rate ? `RR: ${report.content.objective.vitals.respiratory_rate} breaths/min` : ""}
            ${report.content.objective.vitals.oxygen_saturation ? `O2 Sat: ${report.content.objective.vitals.oxygen_saturation}%` : ""}
          </p>
        </div>
        `
            : ""
        }
        <p style="margin: 0; white-space: pre-line;">${report.content.objective.examination || "No examination information provided."}</p>
      </div>
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 16px; margin-bottom: 10px;">Assessment</h4>
        <p style="margin: 0; white-space: pre-line;">${report.content.assessment || "No assessment provided."}</p>
      </div>
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 16px; margin-bottom: 10px;">Plan</h4>
        <p style="margin: 0; white-space: pre-line;">${report.content.plan || "No plan provided."}</p>
      </div>
    `
  } else if (report.type === "clinical") {
    reportContent = `
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 16px; margin-bottom: 10px;">Clinical Findings</h4>
        <p style="margin: 0; white-space: pre-line;">${report.content.findings || "No clinical findings provided."}</p>
      </div>
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 16px; margin-bottom: 10px;">Diagnosis</h4>
        <p style="margin: 0; white-space: pre-line;">${report.content.diagnosis || "No diagnosis provided."}</p>
      </div>
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 16px; margin-bottom: 10px;">Treatment</h4>
        <p style="margin: 0; white-space: pre-line;">${report.content.treatment || "No treatment provided."}</p>
      </div>
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 16px; margin-bottom: 10px;">Recommendations</h4>
        <p style="margin: 0; white-space: pre-line;">${report.content.recommendations || "No recommendations provided."}</p>
      </div>
    `
  } else {
    // Generic report format
    reportContent = `
      <div style="margin-bottom: 20px;">
        <p style="margin: 0; white-space: pre-line;">${report.content.text || JSON.stringify(report.content, null, 2)}</p>
      </div>
    `
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <!-- Letterhead -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="display: flex; align-items: center;">
          <div style="background-color: #2563eb; color: white; padding: 12px; border-radius: 8px; margin-right: 12px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <div>
            <h2 style="font-size: 24px; font-weight: bold; margin: 0;">MEDICAL REPORT</h2>
            <p style="color: #6b7280; margin: 0;">Healthlink Rwanda HDMS</p>
          </div>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: bold; margin: 0;">Healthlink Rwanda HDMS</p>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">KN 5 Rd, Kigali</p>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">Rwanda</p>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">info@healthlinkrwanda.org</p>
        </div>
      </div>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

      <!-- Report Header -->
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 20px; margin-bottom: 15px;">${report.title || "Medical Report"}</h3>
        
        <div style="display: flex; flex-wrap: wrap; margin-bottom: 20px;">
          <div style="width: 50%; margin-bottom: 10px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Date:</p>
            <p style="font-weight: bold; margin: 0;">${format(new Date(report.created_at), "MMMM d, yyyy")}</p>
          </div>
          <div style="width: 50%; margin-bottom: 10px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Report Type:</p>
            <p style="font-weight: bold; margin: 0;">${report.type || "General"}</p>
          </div>
          ${
            report.metadata?.patient_name
              ? `
          <div style="width: 50%; margin-bottom: 10px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Patient:</p>
            <p style="font-weight: bold; margin: 0;">${report.metadata.patient_name}</p>
          </div>
          `
              : ""
          }
          ${
            report.metadata?.doctor_name
              ? `
          <div style="width: 50%; margin-bottom: 10px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Doctor:</p>
            <p style="font-weight: bold; margin: 0;">${report.metadata.doctor_name}</p>
          </div>
          `
              : ""
          }
          ${
            report.metadata?.visit_date
              ? `
          <div style="width: 50%; margin-bottom: 10px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Visit Date:</p>
            <p style="font-weight: bold; margin: 0;">${format(new Date(report.metadata.visit_date), "MMMM d, yyyy")}</p>
          </div>
          `
              : ""
          }
          ${
            report.metadata?.visit_reason
              ? `
          <div style="width: 50%; margin-bottom: 10px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 2px 0;">Visit Reason:</p>
            <p style="font-weight: bold; margin: 0;">${report.metadata.visit_reason}</p>
          </div>
          `
              : ""
          }
        </div>
      </div>

      <!-- Report Content -->
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Report Details</h3>
        ${reportContent}
      </div>

      <!-- Notes -->
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
        <p style="font-weight: 500; margin: 0 0 5px 0;">Notes:</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          This report was generated from Healthlink Rwanda HDMS on ${format(new Date(), "MMMM d, yyyy")} and contains
          confidential medical information. Please handle according to medical privacy regulations.
        </p>
      </div>
    </div>
  `
}
