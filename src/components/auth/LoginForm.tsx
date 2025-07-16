import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Lock, Mail, Shield } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorToken: ''
  });
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      await login(formData.email, formData.password, formData.twoFactorToken);
    } catch (err: any) {
      if (err.response?.status === 428) {
        setShowTwoFactor(true);
      } else {
        setErrors({ general: err.response?.data?.message || 'Login failed' });
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Sign in to VoxVote</h2>
        <p className="text-gray-600 mt-2">Secure blockchain voting platform</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          error={errors.email}
        />

        <Input
          type="password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          error={errors.password}
        />

        {showTwoFactor && (
          <Input
            type="text"
            label="Two-Factor Authentication Code"
            placeholder="Enter 6-digit code"
            value={formData.twoFactorToken}
            onChange={(e) => setFormData({ ...formData, twoFactorToken: e.target.value })}
            required
            maxLength={6}
            error={errors.twoFactorToken}
          />
        )}

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <Shield className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={!formData.email || !formData.password}
        >
          {showTwoFactor ? 'Verify & Sign In' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
            Sign up
          </a>
        </p>
      </div>
    </Card>
  );
};