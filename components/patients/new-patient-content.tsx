// Client component to handle state
"use client"

import { SetStateAction, useState } from "react"
import PatientSearch from "@/components/patients/patient-search"
import PatientForm from "@/components/patients/patient-form"

type NewPatientContentProps = {
  hospitalId: string;
  userId: string;
  doctorName: string;
};

function NewPatientContent({ hospitalId, userId, doctorName }: NewPatientContentProps) {
  const [showSearch, setShowSearch] = useState(true)
  const [existingPatient, setExistingPatient] = useState(null)

  const handlePatientFound = (patient: SetStateAction<null>) => {
    setExistingPatient(patient)
  }

  const handleContinueWithNew = () => {
    setShowSearch(false)
  }

  return (
    <div>
      {showSearch ? (
        <PatientSearch
          hospitalId={hospitalId}
          onPatientFound={handlePatientFound}
          onContinueWithNew={handleContinueWithNew}
        />
      ) : (
        <PatientForm
          hospitalId={hospitalId}
          userId={userId}
          doctorName={doctorName}
          existingPatient={existingPatient}
        />
      )}
    </div>
  )
}

export default NewPatientContent
