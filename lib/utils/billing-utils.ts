/**
 * Billing utility functions
 */

// Define the cost for each diagnosis type
const DIAGNOSIS_COSTS = {
    "Chest X-ray": process.env.NEXT_PUBLIC_PNEUMONIA_PRICE,
    "Brain MRI": process.env.NEXT_PUBLIC_BRAIN_MRI_PRICE,
    "Kidney CT": process.env.NEXT_PUBLIC_CT_KIDNEY_PRICE,
    "Mammography (Breast Cancer Detection)": process.env.NEXT_PUBLIC_MMG_PRICE,
    "Breast Ultrasound": process.env.NEXT_PUBLIC_ULTRASOUND_PRICE,
    "Pneumonia": process.env.NEXT_PUBLIC_PNEUMONIA_PRICE,
    "Bone Fracture": process.env.NEXT_PUBLIC_BONE_FRACTURE_PRICE,
    Other: process.env.NEXT_PUBLIC_OTHER_PRICE,
  }
  
  /**
   * Get the diagnosis costs
   * This is a separate function to avoid exporting an object directly from a 'use server' file
   */
  export async function getDiagnosisCosts() {
    return DIAGNOSIS_COSTS
  }
  
  /**
   * Format currency in Rwandan Francs
   */
  export function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(amount)
  }
  