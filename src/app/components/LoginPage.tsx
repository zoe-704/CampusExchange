import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "./Logo";

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt with:", { email, password });
    // Redirect to dashboard after login
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
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

          {/* Login Card */}
          <Card className="border-2 border-[#0A1E3C]">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-[#0A1E3C]">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-gray-300 focus:border-[#0A1E3C] focus:ring-[#D4AF37]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
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

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#0A1E3C] focus:ring-[#D4AF37]"
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-sm text-[#0A1E3C] hover:text-[#050F1E] hover:underline">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#0A1E3C] hover:bg-[#050F1E] text-white"
                >
                  Sign In
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <a href="#" className="text-[#0A1E3C] hover:text-[#050F1E] hover:underline">
                    Sign up
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-500">
            By signing in, you agree to our{" "}
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
          <h2 className="text-5xl font-bold mb-6">Exchange. Save. Succeed.</h2>
          <p className="text-xl mb-8 text-gray-200">
            Join thousands of students buying, selling, and trading school supplies. 
            Make your student budget go further while helping the environment.
          </p>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-[#D4AF37] rounded-full p-2 mt-1">
                <svg className="w-5 h-5 text-[#0A1E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Save Money</h3>
                <p className="text-gray-200">Get quality supplies at student-friendly prices</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-[#D4AF37] rounded-full p-2 mt-1">
                <svg className="w-5 h-5 text-[#0A1E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Eco-Friendly</h3>
                <p className="text-gray-200">Reduce waste by reusing and recycling supplies</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-[#D4AF37] rounded-full p-2 mt-1">
                <svg className="w-5 h-5 text-[#0A1E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Student Community</h3>
                <p className="text-gray-200">Connect with fellow students on your campus</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}