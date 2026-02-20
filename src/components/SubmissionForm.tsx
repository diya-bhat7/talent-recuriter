import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Send } from "lucide-react";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email")
    .max(255, "Email must be less than 255 characters"),
});

type FormData = z.infer<typeof formSchema>;

const SubmissionForm = () => {
  const [formData, setFormData] = useState<FormData>({ name: "", email: "" });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<FormData> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert submission with source for sync loop prevention
      const { data: insertedData, error } = await supabase
        .from("submissions")
        .insert({
          name: result.data.name,
          email: result.data.email,
          source: "form",
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger Airtable sync
      const { error: syncError } = await supabase.functions.invoke("sync-to-airtable", {
        body: {
          id: insertedData.id,
          name: insertedData.name,
          email: insertedData.email,
          source: "form",
        },
      });

      if (syncError) {
        console.error("Airtable sync error:", syncError);
        // Don't throw - submission succeeded, sync is secondary
      }

      setIsSuccess(true);
      toast.success("Thank you! Your submission was received.");
      setFormData({ name: "", email: "" });

      // Reset success state after animation
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your name"
          className="input-elegant"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive animate-fade-up">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          className="input-elegant"
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-destructive animate-fade-up">{errors.email}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isSuccess}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Submitting...
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Submitted!
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Submit
          </>
        )}
      </button>
    </form>
  );
};

export default SubmissionForm;
