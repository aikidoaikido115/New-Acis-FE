"use client";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { ResidentFormState, Medication, EmergencyContact, EmergencyHospital } from "@/types/resident";
import {
  INITIAL_FORM_STATE,
  INITIAL_MEDICATION,
  INITIAL_EMERGENCY_CONTACT,
  INITIAL_EMERGENCY_HOSPITAL,
} from "./constants";

const toLocalDateString = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function useResidentForm(
  onSubmit: (data: ResidentFormState) => Promise<void>,
  onClose: () => void,
  initialValues?: ResidentFormState,
) {
  const [formData, setFormData] = useState<ResidentFormState>(INITIAL_FORM_STATE);
  const [fullNameInput, setFullNameInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!initialValues) return;
    setFormData(initialValues);
    const displayName = [initialValues.firstName, initialValues.lastName].filter(Boolean).join(" ");
    setFullNameInput(displayName);
  }, [initialValues]);

  // Partial state update helper
  const set = (patch: Partial<ResidentFormState>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  // ── Basic field handlers ─────────────────────────────────────
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    set({ [name]: value } as Partial<ResidentFormState>);
  };

  const handleFullNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setFullNameInput(raw);
    const spaceIdx = raw.trimEnd().lastIndexOf(" ");
    if (spaceIdx === -1) {
      set({ firstName: raw.trimEnd(), lastName: "" });
    } else {
      const head = raw.trimEnd().slice(0, spaceIdx);
      const tail = raw.trimEnd().slice(spaceIdx + 1);
      set({ firstName: head, lastName: tail });
    }
  };

  const handleIdCardChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 13);
    set({ idCardNumber: digits });
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    set({ [e.target.name]: digits } as Partial<ResidentFormState>);
  };

  const handleDateChange = (field: keyof ResidentFormState, date: Date | null) => {
    set({ [field]: date ? toLocalDateString(date) : "" } as Partial<ResidentFormState>);
  };

  // ── Profile image handlers ───────────────────────────────────
  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => set({ profileImage: file, profileImagePreview: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => set({ profileImage: null, profileImagePreview: "" });

  // ── Medication handlers ──────────────────────────────────────
  const updateMedication = (idx: number, patch: Partial<Medication>) =>
    setFormData((prev) => {
      const meds = [...prev.medications];
      meds[idx] = { ...meds[idx], ...patch };
      return { ...prev, medications: meds };
    });

  const addMedication = () =>
    setFormData((prev) => ({ ...prev, medications: [...prev.medications, { ...INITIAL_MEDICATION }] }));

  const removeMedication = (idx: number) =>
    setFormData((prev) => ({ ...prev, medications: prev.medications.filter((_, i) => i !== idx) }));

  // ── Emergency contact handlers ───────────────────────────────
  const updateContact = (idx: number, patch: Partial<EmergencyContact>) =>
    setFormData((prev) => {
      const contacts = [...prev.emergencyContacts];
      contacts[idx] = { ...contacts[idx], ...patch };
      return { ...prev, emergencyContacts: contacts };
    });

  const updateContactPhone = (idx: number, e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    updateContact(idx, { phone: digits });
  };

  const addContact = () =>
    setFormData((prev) => ({ ...prev, emergencyContacts: [...prev.emergencyContacts, { ...INITIAL_EMERGENCY_CONTACT }] }));

  const removeContact = (idx: number) =>
    setFormData((prev) => ({ ...prev, emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== idx) }));

  // ── Emergency hospital handlers ────────────────────────────
  const updateHospital = (idx: number, patch: Partial<EmergencyHospital>) =>
    setFormData((prev) => {
      const hospitals = [...prev.emergencyHospitals];
      hospitals[idx] = { ...hospitals[idx], ...patch };
      return { ...prev, emergencyHospitals: hospitals };
    });

  const updateHospitalPhone = (idx: number, e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    updateHospital(idx, { phone: digits });
  };

  const addHospital = () =>
    setFormData((prev) => ({
      ...prev,
      emergencyHospitals: [...prev.emergencyHospitals, { ...INITIAL_EMERGENCY_HOSPITAL }],
    }));

  const removeHospital = (idx: number) =>
    setFormData((prev) => {
      const next = prev.emergencyHospitals.filter((_, i) => i !== idx);
      return {
        ...prev,
        emergencyHospitals: next.length > 0 ? next : [{ ...INITIAL_EMERGENCY_HOSPITAL }],
      };
    });

  // ── Submit / close ───────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.status) {
      alert("กรุณาเลือกสถานะ");
      return;
    }
    if (!formData.dateOfBirth) {
      alert("กรุณากรอกวันเกิด");
      return;
    }
    if (!formData.gender) {
      alert("กรุณาเลือกเพศ");
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      // keep form data for correction
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setFullNameInput("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return {
    formData,
    fullNameInput,
    setFormData,
    set,
    fileInputRef,
    handleChange,
    handleFullNameChange,
    handleIdCardChange,
    handlePhoneChange,
    handleDateChange,
    handleImageClick,
    handleImageChange,
    handleRemoveImage,
    updateMedication,
    addMedication,
    removeMedication,
    updateContact,
    updateContactPhone,
    addContact,
    removeContact,
    updateHospital,
    updateHospitalPhone,
    addHospital,
    removeHospital,
    handleSubmit,
    handleClose,
    resetForm,
  };
}
