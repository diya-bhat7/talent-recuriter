import SubmissionForm from "@/components/SubmissionForm";

const Index = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "var(--gradient-soft)" }}
    >
      {/* Decorative Floating Orbs */}
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <div className="orb orb-3" aria-hidden="true" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            <span className="text-gradient">Get in Touch</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            We'd love to hear from you. Fill out the form below.
          </p>
        </div>

        {/* Form Card */}
        <div className="form-card animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <SubmissionForm />
        </div>

        {/* Footer */}
        <p
          className="text-center text-sm text-muted-foreground mt-8 animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          ✨ Your information is safe with us
        </p>
      </div>
    </div>
  );
};

export default Index;
