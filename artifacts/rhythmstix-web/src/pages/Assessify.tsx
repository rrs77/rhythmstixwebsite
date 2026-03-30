import ProductPage from "./ProductPage";
import { ClipboardCheck, BarChart3, FileText, Brain, Users, Shield } from "lucide-react";

export default function Assessify() {
  return (
    <ProductPage
      name="Assessify"
      subtitle="Streamlined Assessment for Teachers"
      icon={ClipboardCheck}
      description={[
        "Assessify is a powerful assessment platform built specifically for teachers and schools. Launched in 2024, it transforms the way educators evaluate, record, and report on student progress — replacing clunky spreadsheets with a streamlined, intuitive interface.",
        "The platform offers a user-friendly interface for grading work, evaluating progress, and generating detailed reports. Teachers can quickly record assessments during or after lessons, track student achievement over time, and produce professional reports ready to share with parents and senior leadership.",
        "Assessify leverages AI to streamline the assessment process, making it easier for teachers to focus on what matters most — teaching and enhancing student learning. The tool is designed to save hours of administrative time while providing deeper, more meaningful insights into student progress.",
      ]}
      features={[
        { icon: ClipboardCheck, title: "Quick Assessment", description: "Record student assessments quickly during or after lessons. Intuitive grading interface designed for speed and accuracy." },
        { icon: BarChart3, title: "Progress Tracking", description: "Track student achievement over time with clear visualisations. Identify trends, gaps, and areas for intervention at a glance." },
        { icon: FileText, title: "Report Generation", description: "Generate detailed, professional reports ready to share with parents, senior leadership, and Ofsted. No more manual formatting." },
        { icon: Brain, title: "AI-Powered Insights", description: "Leverage AI to streamline assessment workflows and surface meaningful insights about student learning patterns." },
        { icon: Users, title: "Department-Wide", description: "Designed for whole-school or department use. Share assessment frameworks, moderate grades, and ensure consistency across teachers." },
        { icon: Shield, title: "Secure & Compliant", description: "Student data is stored securely and handled in compliance with UK data protection requirements." },
      ]}
      pros={[
        "Saves hours of administrative time on assessments and reports",
        "AI-powered insights help identify student progress patterns",
        "Professional report generation for parents and leadership",
        "Intuitive interface designed specifically for teachers",
        "Tracks progress over time with clear visualisations",
        "Supports whole-school or department-wide assessment",
        "Replaces scattered spreadsheets with one coherent system",
        "Designed for UK curriculum frameworks",
      ]}
      considerations={[
        "Requires initial setup to configure assessment frameworks",
        "AI features work best with consistent assessment data",
        "Report credit system for advanced reporting features",
        "Best results when adopted across a department or school",
      ]}
      externalUrl="https://www.assessify.co.uk/"
      externalLabel="Visit Assessify"
      ctaHeading="Ready to transform your assessments?"
      ctaText="Stop spending hours on spreadsheets. Assessify gives teachers a fast, intelligent way to assess, track, and report on student progress."
    />
  );
}
