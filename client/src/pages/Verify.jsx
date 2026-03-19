import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

const Verify = () => {
  const [status, setStatus] = useState("Verifying your login link...");
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleVerification = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem("emailForSignIn");

        if (!email) {
            email = window.prompt("Please provide your email for confirmation");
        }
        
        if (!email) {
            setStatus("Verification failed: Email is required.");
            return;
        }

        try {
          const result = await signInWithEmailLink(auth, email, window.location.href);
          window.localStorage.removeItem("emailForSignIn");
          
          setStatus("Authenticating with ROOMS server...");
          
          const idToken = await result.user.getIdToken();
          const response = await api.post("/auth/firebase-login", { idToken });
          
          login(response.data.accessToken, response.data.user);
          
          toast.success(response.data.message || "Successfully authenticated!");
          navigate("/dashboard", { replace: true });
          
        } catch (error) {
          console.error("Firebase Login Error:", error);
          setStatus("Verification failed. The link may be expired or invalid.");
          toast.error("Invalid or expired sign-in link.");
        }
      } else {
        setStatus("Invalid verification URL.");
      }
    };
    
    handleVerification();
  }, [navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f1012', color: '#fff' }}>
        <div style={{ padding: '40px', background: '#1b1d21', borderRadius: '24px', textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '40px', marginBottom: '20px', color: '#F0A026', animation: 'pulse 1.5s infinite' }}>◈</div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{status}</h2>
        </div>
    </div>
  );
};

export default Verify;
