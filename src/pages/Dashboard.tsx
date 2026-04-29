import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser, updateProfile } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { LogOut, PlayCircle, CreditCard, AlertTriangle, CheckCircle, Edit2, Trash2, X, Save, AlertCircle as AlertCircleIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { user, subscription, loading, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      setEditForm({ name: user.fullName, phone: user.phone });
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSuccess('');
    setIsSaving(true);
    const path = `users/${user.id}`;
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: editForm.name });
        await updateDoc(doc(db, 'users', user.id), {
          name: editForm.name,
          phoneNumber: editForm.phone
        });
        setUser({ ...user, fullName: editForm.name, phone: editForm.phone });
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        setError("You do not have permission to update this profile.");
      } else {
        try {
          handleFirestoreError(err, OperationType.UPDATE, path);
        } catch (finalErr: any) {
          setError("Something went wrong. Please try again.");
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setError('');
    setIsSaving(true);
    const path = `users/${user.id}`;
    try {
      if (auth.currentUser) {
        await deleteDoc(doc(db, 'users', user.id));
        await deleteUser(auth.currentUser);
        await logout();
        navigate('/');
      }
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Security requirement: Please log out and log back in to delete your account.');
      } else if (err.code === 'permission-denied') {
        setError("You do not have permission to delete this account.");
      } else {
        try {
          handleFirestoreError(err, OperationType.DELETE, path);
        } catch (finalErr: any) {
          setError("Something went wrong. Please try again.");
        }
      }
      setShowDeleteConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };

  const isActive = subscription?.status === 'active' || user.email?.toLowerCase() === 'njeirheinard21@gmail.com';
  const isExpired = subscription?.status === 'expired';

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.welcome', 'Welcome, ')}{user.fullName.split(' ')[0]}!</h1>
            <p className="text-gray-600">{t('dashboard.manage_account', 'Manage your account and seminar access.')}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            {t('dashboard.sign_out', 'Sign Out')}
          </button>
        </div>

        {/* Subscription Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('dashboard.status_title', 'Subscription Status')}</h2>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {isActive ? (
                <div className="bg-green-100 p-4 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              ) : (
                <div className="bg-orange-100 p-4 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              )}
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-600 font-medium">{t('dashboard.status', 'Status:')}</span>
                  <span className={`font-bold uppercase tracking-wider text-sm px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {subscription?.status || t('dashboard.none', 'None')}
                  </span>
                </div>
                {subscription?.planType !== 'none' && (
                  <div className="text-gray-600">
                    {t('dashboard.plan', 'Plan:')} <span className="font-semibold capitalize text-gray-900">{subscription?.planType}</span>
                  </div>
                )}
                {subscription?.expiryDate && (
                  <div className="text-sm text-gray-500 mt-1">
                    {t('dashboard.expires', 'Expires:')} {new Date(subscription.expiryDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-3">
              {isActive ? (
                <Link
                  to="/seminars"
                  className="flex items-center justify-center gap-2 bg-[#8B5CF6] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#7C3AED] transition-all shadow-md hover:shadow-lg"
                >
                  <PlayCircle className="h-5 w-5" />
                  {t('dashboard.access_seminars', 'Access Seminars')}
                </Link>
              ) : (
                <Link
                  to="/seminars"
                  className="flex items-center justify-center gap-2 bg-[#059669] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#047857] transition-all shadow-md hover:shadow-lg"
                >
                  <CreditCard className="h-5 w-5" />
                  {isExpired ? t('dashboard.renew', 'Renew Subscription') : t('dashboard.subscribe', 'Subscribe Now')}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('dashboard.account_details', 'Account Details')}</h2>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-sm font-medium text-[#059669] hover:text-[#047857] transition-colors"
              >
                <Edit2 className="h-4 w-4" /> {t('dashboard.edit_profile', 'Edit Profile')}
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl flex items-start gap-3 text-sm">
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              {success}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.full_name', 'Full Name')}</label>
                  <input 
                    type="text" 
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.email', 'Email Address')}</label>
                  <input 
                    type="email" 
                    disabled
                    value={user.email}
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-gray-500 cursor-not-allowed"
                    title="Email cannot be changed here"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.phone', 'Phone Number')}</label>
                  <input 
                    type="tel" 
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-[#059669] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#047857] transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {isSaving ? t('dashboard.saving', 'Saving...') : t('dashboard.save_changes', 'Save Changes')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({ name: user.fullName, phone: user.phone });
                    setError('');
                    setSuccess('');
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> {t('dashboard.cancel', 'Cancel')}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">{t('dashboard.full_name', 'Full Name')}</label>
                <div className="text-gray-900 font-medium">{user.fullName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">{t('dashboard.email', 'Email Address')}</label>
                <div className="text-gray-900 font-medium">{user.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">{t('dashboard.phone', 'Phone Number')}</label>
                <div className="text-gray-900 font-medium">{user.phone || t('dashboard.not_provided', 'Not provided')}</div>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="mt-12 pt-8 border-t border-red-100">
            <h3 className="text-lg font-bold text-red-600 mb-2">{t('dashboard.danger_zone', 'Danger Zone')}</h3>
            <p className="text-gray-600 text-sm mb-4">{t('dashboard.danger_desc', 'Once you delete your account, there is no going back. Please be certain.')}</p>
            
            {showDeleteConfirm ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h4 className="font-bold text-red-800 mb-2">{t('dashboard.are_you_sure', 'Are you absolutely sure?')}</h4>
                <p className="text-red-600 text-sm mb-6">{t('dashboard.delete_warning', 'This action cannot be undone. This will permanently delete your account, subscription, and remove your data from our servers.')}</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isSaving}
                    className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-red-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? t('dashboard.deleting', 'Deleting...') : <><Trash2 className="h-4 w-4" /> {t('dashboard.yes_delete', 'Yes, delete my account')}</>}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSaving}
                    className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    {t('dashboard.cancel', 'Cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 text-red-600 border border-red-200 bg-white hover:bg-red-50 px-6 py-2.5 rounded-xl font-medium transition-all"
              >
                <Trash2 className="h-4 w-4" /> {t('dashboard.delete_account', 'Delete Account')}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
