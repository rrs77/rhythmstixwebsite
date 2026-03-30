import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useWPPosts } from "@/hooks/use-wp";
import { decodeHtml } from "@/lib/wordpress";
import { Loader2, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function BlogList() {
  const { data: posts, isLoading, error } = useWPPosts(50);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Blog & Resources</h1>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Unable to load posts. Please try again later.</p>
            </div>
          )}
          {posts && (
            <div className="grid gap-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className="block bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group"
                >
                  <h2 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                    {decodeHtml(post.title.rendered)}
                  </h2>
                  <div
                    className="text-muted-foreground text-sm line-clamp-2 mb-3"
                    dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                  />
                  <div className="flex items-center text-primary text-sm font-medium">
                    Read More <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
