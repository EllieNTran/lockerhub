import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Lock, Mail, Hash } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  useDepartments, 
  useOffices, 
  useSignup, 
  useValidateStaffNumber 
} from "@/services/auth";


const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    staffNumber: "",
    departmentId: "",
    office: "",
  });
  const [error, setError] = useState("");
  const [staffNumberError, setStaffNumberError] = useState("");

  const { data: departments = [], isLoading: isLoadingDepartments } = useDepartments();
  const { data: offices = [], isLoading: isLoadingOffices } = useOffices();
  const signupMutation = useSignup();
  const validateStaffNumberMutation = useValidateStaffNumber();

  const isLoadingMetadata = isLoadingDepartments || isLoadingOffices;

  useEffect(() => {
    const validateStaffNum = async () => {
      if (formData.staffNumber.length === 8) {
        validateStaffNumberMutation.mutate(formData.staffNumber, {
          onSuccess: (result) => {
            if (!result.available) {
              setStaffNumberError(result.message);
            } else {
              setStaffNumberError("");
            }
          },
          onError: () => {
            // Ignore validation errors silently
          },
        });
      } else {
        setStaffNumberError("");
      }
    };

    const timeoutId = setTimeout(validateStaffNum, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.staffNumber, validateStaffNumberMutation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'email' ? value.trim() : value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    const validations = [
      { condition: formData.password !== formData.confirmPassword, message: "Passwords do not match" },
      { condition: formData.password.length < 8, message: "Password must be at least 8 characters" },
      { condition: formData.staffNumber.length !== 8, message: "Staff number must be exactly 8 characters" },
      { condition: !!staffNumberError, message: "Please fix the staff number error before submitting" },
      { condition: !formData.departmentId, message: "Please select a department" },
      { condition: !formData.office, message: "Please select an office" },
    ];

    for (const { condition, message } of validations) {
      if (condition) {
        setError(message);
        return;
      }
    }

    signupMutation.mutate(
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        staffNumber: formData.staffNumber,
        departmentId: formData.departmentId,
        office: formData.office,
      },
      {
        onSuccess: () => {
          navigate("/login");
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showNav={false} />
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Lock className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Sign up</CardTitle>
            <p className="text-sm text-center text-grey mt-2">
              Already registered?{" "}
              <Link to="/check-account" className="text-primary hover:underline font-medium">
                Check your account status
              </Link>
            </p>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg bg-error/15 p-3 text-sm text-error">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-grey" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staffNumber">Staff Number</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-grey" />
                    <Input
                      id="staffNumber"
                      name="staffNumber"
                      type="text"
                      placeholder="ST001234"
                      value={formData.staffNumber}
                      onChange={handleChange}
                      className="pl-9"
                      maxLength={8}
                      required
                    />
                  </div>
                  {staffNumberError && (
                    <p className="text-xs text-error">{staffNumberError}</p>
                  )}
                  {!staffNumberError && formData.staffNumber.length === 8 && (
                    <p className="text-xs text-success">✓ Staff number is available</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                    disabled={isLoadingMetadata}
                  >
                    <SelectTrigger id="departmentId">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="office">Office Location</Label>
                <Select
                  value={formData.office}
                  onValueChange={(value) => setFormData({ ...formData, office: value })}
                  disabled={isLoadingMetadata}
                >
                  <SelectTrigger id="office">
                    <SelectValue placeholder="Select office" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {offices.map((office) => (
                      <SelectItem key={office} value={office}>
                        {office}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-grey">
                  Must be at least 8 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={signupMutation.isPending || isLoadingMetadata || !!staffNumberError}>
                {signupMutation.isPending ? "Creating account..." : "Create account"}
              </Button>
              <p className="text-sm text-center text-grey">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;
