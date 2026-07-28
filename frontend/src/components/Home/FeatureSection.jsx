import { Truck, Shield, Headphones, CreditCard } from 'lucide-react';

const FeatureSection = () => {
  const features = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'Free shipping on orders over $50 worldwide'
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: '100% secure payment with SSL encryption'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Dedicated customer support available anytime'
    },
    {
      icon: CreditCard,
      title: 'Easy Returns',
      description: '30-day return policy for your peace of mind'
    }
  ];

  return (
    <section className="py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="glass-card p-6 text-center hover:glow-on-hover animate-smooth">
            <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center">
              <feature.icon className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {feature.title}
            </h3>
            <p className="text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeatureSection;