import ProductPage from "./ProductPage";
import { ClipboardCheck, BarChart3, FileText, Brain, Users, Shield, Target, Sliders, Database, FileSpreadsheet } from "lucide-react";

export default function Assessify() {
  return (
    <ProductPage
      name="Assessify"
      subtitle="Assessment Transformed for Teachers"
      icon={ClipboardCheck}
      description={[
        "Say goodbye to dry AI-generated reports with Assessify. Assessment across all subjects has always been a challenge — making it useful and transparent for pupils, and informative for parents, is often time-consuming and frustrating for teachers. But there is another way.",
        "Assessify is a powerful assessment tool designed to work across any subject. Originally built for Performing Arts, its flexible framework adapts to any curriculum area — from Music and Drama to English, Science, and beyond. Through a user-friendly interface you can quickly and easily grade work, evaluate student progress and generate detailed reports. Leveraging the power of artificial intelligence, Assessify streamlines the assessment process for teachers and enhances student learning.",
        "Using personalised 'I can' statements throughout all lessons for AFL, you can ensure that your reports are personable, relevant and helpful to pupils. Build your own bank of assessments for each year group you teach and tailor the rubrics to match the needs of your children — keeping all previous assessments in one place so you can review progress easily.",
      ]}
      features={[
        { icon: Target, title: "Accurate & Fair Grading", description: "Ensures fair and unbiased grading of assignments and assessments based on teacher-created rubrics and assessment criteria lists — adaptable to any subject." },
        { icon: Brain, title: "AI-Powered Reports", description: "Leverage bespoke AI tools to evaluate student performance and generate detailed, personalised reports — not dry, generic ones." },
        { icon: BarChart3, title: "Insightful Analytics", description: "Generates detailed analytics and reports to inform your teaching, address student needs and support progress over time." },
        { icon: Sliders, title: "Fully Customisable", description: "Customise assessment criteria to match your units, curriculum requirements and pupil needs across any subject. Create differentiated 'I can' statements or use the growing bank of ready-made criteria." },
        { icon: Database, title: "Assessment Bank", description: "Build your own bank of assessments for each year group and subject. Keep all previous assessments in one place so you can review progress and be prepared for pupil progress meetings." },
        { icon: FileSpreadsheet, title: "Ready-Made Spreadsheets", description: "Export detailed spreadsheets for each unit to print and share with colleagues. Get organised for those pupil progress meetings." },
        { icon: Shield, title: "User-Friendly Interface", description: "Enjoy a seamless and intuitive experience with no advanced tech knowledge needed. Sign up, set up your classes, and start assessing." },
        { icon: Users, title: "PeriPlanner Included", description: "PeriPlanner (now PeriFeedback) is included free with all Assessify plans — including the free plan — for scheduling and feedback management." },
        { icon: FileText, title: "Termly Reviews & Reports", description: "Create pupil progress feedback reports and termly reviews for parents with personalised, curriculum-aligned content." },
      ]}
      pros={[
        "Works across any subject — not limited to one curriculum area",
        "Originally proven in Performing Arts, now adaptable to all disciplines",
        "AI-powered reports that are personable and relevant, not dry and generic",
        "Fair and unbiased grading based on teacher-created rubrics",
        "Saves hours of administrative time on assessments and reports",
        "Customisable 'I can' statements for meaningful AFL",
        "Assessment bank keeps all previous assessments in one place",
        "Ready-made spreadsheets for sharing with colleagues",
        "PeriFeedback included free with all plans",
        "Detailed analytics inform teaching and support progress",
        "No advanced tech knowledge needed",
      ]}
      considerations={[
        "Requires initial setup to create classes and customise assessment criteria",
        "AI report features work best with consistent assessment data over time",
        "Ready-made criteria currently strongest for Performing Arts, with other subjects growing",
        "Best results when assessment criteria are tailored to your curriculum",
      ]}
      youtubeVideoId="WpnV7FNptW0"
      ctaHeading="Ready to transform your assessments?"
      ctaText="Say goodbye to dry, generic reports. Assessify gives teachers across every subject a fast, intelligent way to assess, track, and report on student progress — with AI-powered insights that actually sound like you wrote them."
    />
  );
}
