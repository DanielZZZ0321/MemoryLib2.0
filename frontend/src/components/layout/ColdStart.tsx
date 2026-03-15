import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Target,
  Layers,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  TrendingUp,
  Heart,
  Users,
  MapPin,
  Tag
} from 'lucide-react';
import { Select } from '@/components/ui/select';

// Types
interface ColdStartConfig {
  startTime: Date | null;
  endTime: Date | null;
  granularity: 'day' | 'week' | 'month' | null;
  purpose: 'review' | 'diary' | 'slides' | 'reflection' | null;
  primaryIndex: string | null;
  secondaryIndex: string | null;
}

interface ColdStartProps {
  onComplete?: (config: ColdStartConfig) => void;
}

const STEPS = ['range', 'granularity', 'purpose', 'indices'] as const;

// Reuse options from FilterToolbar
const PRIMARY_INDEX_OPTIONS = [
  { value: 'event', label: 'Event' },
  { value: 'emotion', label: 'Emotion' },
  { value: 'people', label: 'People' },
  { value: 'location', label: 'Location' },
  { value: 'time', label: 'Time' },
  { value: 'keyword', label: 'Keywords' },
];

const GRANULARITY_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

const PURPOSE_OPTIONS = [
  { value: 'review', label: 'Memory Review', icon: Sparkles },
  { value: 'diary', label: 'Diary', icon: BookIcon },
  { value: 'slides', label: 'Slides', icon: PresentationIcon },
  { value: 'reflection', label: 'Reflection', icon: ReflectIcon },
];

const INDEX_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  time: Clock,
  emotion: Heart,
  people: Users,
  location: MapPin,
  event: Tag,
  keyword: TrendingUp,
};

// Custom icons for purpose
function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function PresentationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  );
}

function ReflectIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function ColdStart({ onComplete }: ColdStartProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [config, setConfig] = useState<ColdStartConfig>({
    startTime: null,
    endTime: null,
    granularity: null,
    purpose: null,
    primaryIndex: null,
    secondaryIndex: null,
  });
  const [isCompleted, setIsCompleted] = useState(false);

  const stepIcons = [Calendar, Clock, Target, Layers];
  const stepLabels = ['Time Range', 'Granularity', 'Purpose', 'Indices'];

  const canProceed = () => {
    switch (STEPS[currentStep]) {
      case 'range':
        return config.startTime !== null && config.endTime !== null;
      case 'granularity':
        return config.granularity !== null;
      case 'purpose':
        return config.purpose !== null;
      case 'indices':
        return config.primaryIndex !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete
      setIsCompleted(true);
      console.log('Cold Start Config:', config);
      // Call onComplete callback
      if (onComplete) {
        onComplete(config);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle date input changes
  const handleDateChange = (field: 'startTime' | 'endTime', value: string) => {
    if (value) {
      setConfig(prev => ({ ...prev, [field]: new Date(value) }));
    } else {
      setConfig(prev => ({ ...prev, [field]: null }));
    }
  };

  // Format date for input
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep]) {
      case 'range':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Select Time Range</h3>
              <p className="text-zinc-500 dark:text-zinc-400">Choose the period of memories you want to work with</p>
            </div>

            {/* Date inputs */}
            <div className="flex gap-6 justify-center items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Start Date</label>
                <input
                  type="date"
                  value={formatDateForInput(config.startTime)}
                  onChange={(e) => handleDateChange('startTime', e.target.value)}
                  className="w-48 px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="flex items-end pb-3 text-zinc-400 text-lg">→</div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">End Date</label>
                <input
                  type="date"
                  value={formatDateForInput(config.endTime)}
                  onChange={(e) => handleDateChange('endTime', e.target.value)}
                  className="w-48 px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {config.startTime && config.endTime && (
              <div className="text-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm">
                  <Calendar className="w-4 h-4" />
                  {Math.ceil(Math.abs(config.endTime.getTime() - config.startTime.getTime()) / (1000 * 60 * 60 * 24))} days selected
                </span>
              </div>
            )}
          </div>
        );

      case 'granularity':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Time Granularity</h3>
              <p className="text-zinc-500 dark:text-zinc-400">How should your memories be grouped?</p>
            </div>

            {/* Using Select component like FilterToolbar */}
            <div className="max-w-xs mx-auto">
              <Select
                value={config.granularity || ''}
                onChange={(value) => setConfig(prev => ({ ...prev, granularity: value as typeof config.granularity }))}
                options={GRANULARITY_OPTIONS}
                placeholder="Select granularity"
                className="bg-zinc-100 dark:bg-zinc-800/50 border-transparent w-full text-base py-3 rounded-xl"
              />
            </div>

            <div className="flex justify-center gap-4">
              {GRANULARITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setConfig(prev => ({ ...prev, granularity: option.value as typeof config.granularity }))}
                  className={`w-32 p-4 rounded-xl border-2 transition-all ${
                    config.granularity === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800'
                  }`}
                >
                  <div className={`text-sm font-semibold ${config.granularity === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'purpose':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">What's Your Purpose?</h3>
              <p className="text-zinc-500 dark:text-zinc-400">What do you want to do with your memories?</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
              {PURPOSE_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setConfig(prev => ({ ...prev, purpose: option.value as typeof config.purpose }))}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      config.purpose === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-3 ${config.purpose === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`} />
                    <div className={`font-semibold ${config.purpose === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {option.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'indices':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Organization Indices</h3>
              <p className="text-zinc-500 dark:text-zinc-400">How should your data be organized?</p>
            </div>

            <div className="space-y-6 max-w-xl mx-auto">
              {/* Primary Index - Using Select like FilterToolbar */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Primary Index <span className="text-red-500">*</span>
                </label>
                <Select
                  value={config.primaryIndex || ''}
                  onChange={(value) => setConfig(prev => ({ ...prev, primaryIndex: value }))}
                  options={PRIMARY_INDEX_OPTIONS}
                  placeholder="Select primary index"
                  className="bg-zinc-100 dark:bg-zinc-800/50 border-transparent w-full text-base py-3 rounded-xl"
                />
              </div>

              {/* Secondary Index */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Secondary Index <span className="text-zinc-400">(optional)</span>
                </label>
                <Select
                  value={config.secondaryIndex || ''}
                  onChange={(value) => setConfig(prev => ({ ...prev, secondaryIndex: value }))}
                  options={PRIMARY_INDEX_OPTIONS.filter(opt => opt.value !== config.primaryIndex)}
                  placeholder="Select secondary index"
                  className="bg-zinc-100 dark:bg-zinc-800/50 border-transparent w-full text-base py-3 rounded-xl"
                />
              </div>

              {/* Visual index selection */}
              <div className="grid grid-cols-3 gap-3 pt-4">
                {PRIMARY_INDEX_OPTIONS.map((option) => {
                  const Icon = INDEX_ICONS[option.value] || Tag;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setConfig(prev => ({ ...prev, primaryIndex: option.value }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        config.primaryIndex === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-2 ${config.primaryIndex === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`} />
                      <div className={`text-sm font-medium ${config.primaryIndex === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {option.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Setup Complete!</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Your memory workspace is ready</p>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-6 max-w-md mx-auto text-left">
            <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">Configuration Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Time Range:</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {config.startTime?.toLocaleDateString()} - {config.endTime?.toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Granularity:</span>
                <span className="text-zinc-900 dark:text-zinc-100 capitalize">{config.granularity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Purpose:</span>
                <span className="text-zinc-900 dark:text-zinc-100 capitalize">{config.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Primary Index:</span>
                <span className="text-zinc-900 dark:text-zinc-100 capitalize">{config.primaryIndex}</span>
              </div>
              {config.secondaryIndex && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Secondary Index:</span>
                  <span className="text-zinc-900 dark:text-zinc-100 capitalize">{config.secondaryIndex}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setIsCompleted(false);
              setCurrentStep(0);
              setConfig({
                startTime: null,
                endTime: null,
                granularity: null,
                purpose: null,
                primaryIndex: null,
                secondaryIndex: null,
              });
            }}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Progress Steps */}
      <div className="mb-12">
        <div className="flex items-center justify-center">
          {STEPS.map((_, index) => {
            const Icon = stepIcons[index];
            const isActive = index === currentStep;
            const isCompletedStep = index < currentStep;
            return (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : isCompletedStep
                        ? 'bg-green-500 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                    }`}
                  >
                    {isCompletedStep ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {stepLabels[index]}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-20 h-0.5 mx-2 ${
                      index < currentStep ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
            currentStep === 0
              ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
              : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
            canProceed()
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed'
          }`}
        >
          {currentStep === STEPS.length - 1 ? 'Complete Setup' : 'Next'}
          {currentStep < STEPS.length - 1 && <ChevronRight className="w-5 h-5" />}
          {currentStep === STEPS.length - 1 && <Check className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}