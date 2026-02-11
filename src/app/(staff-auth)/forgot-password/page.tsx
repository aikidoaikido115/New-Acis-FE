"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLogo } from "@/components/shared/branding/staff-app-logo";
import { StepEmail } from "@/components/features/staff-auth/step-email";
import { StepOTP } from "@/components/features/staff-auth/step-otp";
import { StepReset } from "@/components/features/staff-auth/step-reset";

type Step = "email" | "otp" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const handleEmailSubmit = (submittedEmail: string) => {
    setEmail(submittedEmail);
    setCurrentStep("otp");
  };

  const handleOTPSubmit = (submittedOtp: string) => {
    setOtp(submittedOtp);
    setCurrentStep("reset");
  };

  const handleResetComplete = () => {
    // Show success message and redirect to login
    alert("รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว");
    router.push("/login");
  };

  const handleBackToEmail = () => {
    setCurrentStep("email");
  };

  return (
    <>
      <AppLogo />
      
      {currentStep === "email" && (
        <StepEmail onNext={handleEmailSubmit} />
      )}
      
      {currentStep === "otp" && (
        <StepOTP 
          email={email} 
          onNext={handleOTPSubmit}
          onBack={handleBackToEmail}
        />
      )}
      
      {currentStep === "reset" && (
        <StepReset 
          email={email}
          otp={otp}
          onComplete={handleResetComplete}
        />
      )}
    </>
  );
}
