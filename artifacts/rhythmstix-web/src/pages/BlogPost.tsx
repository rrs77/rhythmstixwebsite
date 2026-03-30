import { useParams } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useWPPost } from "@/hooks/use-wp";
import { decodeHtml } from "@/lib/wordpress";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useWPPost(slug || "");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" className="mb-6 text-muted-foreground" asChild>
            <Link href="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </Button>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Unable to load this post. Please try again later.</p>
            </div>
          )}
          {post && (
            <>
              <h1 className="text-4xl font-bold mb-4 text-foreground">
                {decodeHtml(post.title.rendered)}
              </h1>
              <p className="text-muted-foreground text-sm mb-8">
                {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <div
                className="wp-content prose prose-invert prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content.rendered }}
              />
            </>
          )}
          {!isLoading && !error && !post && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Post not found.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
