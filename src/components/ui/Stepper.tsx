import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
    id: number;
    name: string;
}

interface StepperProps {
    steps: Step[];
    currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
    return (
        <div className="flex items-center justify-center">
            {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                    {/* Step Circle */}
                    <div className="flex flex-col items-center">
                        <div
                            className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                                currentStep > step.id
                                    ? 'bg-primary text-primary-foreground'
                                    : currentStep === step.id
                                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                                        : 'bg-muted text-muted-foreground'
                            )}
                        >
                            {currentStep > step.id ? (
                                <Check className="h-5 w-5" />
                            ) : (
                                step.id
                            )}
                        </div>
                        <span
                            className={cn(
                                'mt-2 text-xs font-medium transition-colors',
                                currentStep >= step.id
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                            )}
                        >
                            {step.name}
                        </span>
                    </div>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                        <div
                            className={cn(
                                'w-16 md:w-24 h-0.5 mx-2 transition-colors duration-300',
                                currentStep > step.id ? 'bg-primary' : 'bg-muted'
                            )}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
