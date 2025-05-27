import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Hero = () => {
  const { currentUser } = useAuth();

  return (
    <section className="pt-24 pb-16 px-6 min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-white" />
      
      {/* Animated background elements - now black and white */}
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-black/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-black/5 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="container mx-auto text-center relative z-10">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-black mb-8">
            <span className="text-sm font-medium text-black">
              🚀 Now in Beta
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 text-balance leading-tight">
            Welcome to{' '}
            <span className="text-black">
              Parkd
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-black mb-8 max-w-2xl mx-auto text-balance leading-relaxed">
            Experience the future of parking solutions with our elegant, modern platform designed for simplicity and efficiency.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {currentUser ? (
              <Button 
                size="lg"
                className="text-base font-medium bg-black hover:bg-black/90 transition-all duration-300 shadow-lg hover:shadow-xl px-8 py-6 animate-scale-in border-0"
                asChild
              >
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button 
                  size="lg"
                  className="text-base font-medium bg-black hover:bg-black/90 transition-all duration-300 shadow-lg hover:shadow-xl px-8 py-6 animate-scale-in border-0"
                  asChild
                >
                  <Link to="/signup">Sign Up</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-base font-medium border-black bg-white hover:bg-white/90 transition-all duration-300 px-8 py-6 animate-scale-in delay-100 text-black"
                  asChild
                >
                  <Link to="/signin">Sign In</Link>
                </Button>
              </>
            )}
          </div>

          {/* Features preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fade-in delay-300">
            {[
              { title: 'Smart Booking', desc: 'AI-powered parking recommendations' },
              { title: 'Real-time Updates', desc: 'Live availability and navigation' },
              { title: 'Seamless Payments', desc: 'One-tap payment processing' }
            ].map((feature, index) => (
              <div 
                key={feature.title}
                className="p-6 rounded-2xl bg-white border border-black hover:border-black/70 transition-all duration-300 hover:scale-105"
              >
                <h3 className="font-display font-semibold text-black mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-black">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
