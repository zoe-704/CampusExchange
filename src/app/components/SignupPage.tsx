import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "@/app/lib/auth";

const SCHOOL_EMAIL_DOMAIN = "menloschool.org";

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.toLowerCase().endsWith(`@${SCHOOL_EMAIL_DOMAIN}`)) {
      setError(`Please use your @${SCHOOL_EMAIL_DOMAIN} email address to sign up.`);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const { error: signUpError, needsEmailConfirmation } = await signUp(email, password, fullName.trim());
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    if (needsEmailConfirmation) {
      setConfirmationSent(true);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <Logo size={120} />
          </div>

          {/* Brand Name */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#0A1E3C] mb-2">Campus Exchange</h1>
            <p className="text-gray-600">Student Supply Exchange</p>
          </div>

          {/* Signup Card */}
          <Card className="border-2 border-[#0A1E3C]">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-[#0A1E3C]">Create Your Account</CardTitle>
              <CardDescription className="text-center">
                Sign up with your @{SCHOOL_EMAIL_DOMAIN} email to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              {confirmationSent ? (
                <div className="text-center py-6 space-y-4">
                  <CheckCircle className="mx-auto text-green-500" size={48} />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Check your inbox</p>
                    <p className="text-sm text-gray-600">
                      We sent a confirmation link to <span className="font-medium">{email}</span>. Confirm your
                      email, then sign in.
                    </p>
                  </div>
                  <Link to="/">
                    <Button className="w-full bg-[#0A1E3C] hover:bg-[#050F1E] text-white">Back to Sign In</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Jordan Lee"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="border-gray-300 focus:border-[#0A1E3C] focus:ring-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">School Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={`student@${SCHOOL_EMAIL_DOMAIN}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-gray-300 focus:border-[#0A1E3C] focus:ring-[#D4AF37]"
                    />
                    <p className="text-xs text-gray-500">Must end in @{SCHOOL_EMAIL_DOMAIN}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="border-gray-300 focus:border-[#0A1E3C] focus:ring-[#D4AF37] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="border-gray-300 focus:border-[#0A1E3C] focus:ring-[#D4AF37]"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#0A1E3C] hover:bg-[#050F1E] text-white"
                  >
                    {submitting ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              )}

              {!confirmationSent && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link to="/" className="text-[#0A1E3C] hover:text-[#050F1E] hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-500">
            By signing up, you agree to our{" "}
            <a href="#" className="text-[#0A1E3C] hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-[#0A1E3C] hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* Right side - Hero Image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#0A1E3C] via-[#163A5F] to-[#0A1E3C] items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-[#D4AF37] rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full opacity-10 blur-3xl"></div>

        <div className="relative z-10 text-white max-w-lg">
          <h2 className="text-5xl font-bold mb-6">Join Your Class.</h2>
          <p className="text-xl mb-8 text-gray-200">
            Campus Exchange is exclusively for Menlo School students. Verify your school email to start buying,
            selling, and trading with classmates you can trust.
          </p>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-[#D4AF37] rounded-full p-2 mt-1">
                <svg className="w-5 h-5 text-[#0A1E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Verified Students Only</h3>
                <p className="text-gray-200">Every account is tied to a real @{SCHOOL_EMAIL_DOMAIN} address</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-[#D4AF37] rounded-full p-2 mt-1">
                <svg className="w-5 h-5 text-[#0A1E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Safe Campus Meetups</h3>
                <p className="text-gray-200">Trade at verified locations during school hours</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-[#D4AF37] rounded-full p-2 mt-1">
                <svg className="w-5 h-5 text-[#0A1E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Free to Join</h3>
                <p className="text-gray-200">No fees to list, browse, or message other students</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
