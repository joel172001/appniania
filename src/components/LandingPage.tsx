import { ArrowRight, Shield, TrendingUp, Users, Zap, Lock, DollarSign } from 'lucide-react';

type LandingPageProps = {
  onGetStarted: () => void;
};

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <nav className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">Ac</span>
              </div>
              <span className="text-xl font-bold text-white">Acripton</span>
            </div>
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Grow Your Wealth with
            <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Smart USDT Investments
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Start earning daily returns on your USDT deposits. Secure, transparent, and automated investment platform built for everyone.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center gap-2 mx-auto shadow-xl shadow-blue-500/20"
          >
            Start Investing Now
            <ArrowRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700 hover:border-blue-500/50 transition-all">
            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="text-blue-400" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Daily Returns</h3>
            <p className="text-slate-300">
              Earn up to 3% daily returns on your investments. Watch your balance grow automatically every day.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700 hover:border-cyan-500/50 transition-all">
            <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
              <Shield className="text-cyan-400" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Secure Platform</h3>
            <p className="text-slate-300">
              Your funds are protected with enterprise-grade security. Transparent transactions and full control.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700 hover:border-emerald-500/50 transition-all">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
              <Zap className="text-emerald-400" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Instant Deposits</h3>
            <p className="text-slate-300">
              Quick and easy USDT deposits via TRC20. Start earning immediately after your first deposit.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-800/30 backdrop-blur py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Investment Plans</h2>
            <p className="text-xl text-slate-300">Choose the plan that fits your goals</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-blue-500 transition-all">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                <div className="text-4xl font-bold text-blue-400 mb-2">1.5%</div>
                <p className="text-slate-400">daily for 30 days</p>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-slate-300">
                  <DollarSign size={18} className="text-blue-400" />
                  <span className="text-sm">$25 - $200</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <TrendingUp size={18} className="text-blue-400" />
                  <span className="text-sm">45% total return</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-cyan-500 hover:border-cyan-400 transition-all relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  POPULAR
                </span>
              </div>
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-white mb-2">Growth</h3>
                <div className="text-4xl font-bold text-cyan-400 mb-2">2.0%</div>
                <p className="text-slate-400">daily for 60 days</p>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-slate-300">
                  <DollarSign size={18} className="text-cyan-400" />
                  <span className="text-sm">$200 - $500</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <TrendingUp size={18} className="text-cyan-400" />
                  <span className="text-sm">120% total return</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-emerald-500 transition-all">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                <div className="text-4xl font-bold text-emerald-400 mb-2">2.5%</div>
                <p className="text-slate-400">daily for 90 days</p>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-slate-300">
                  <DollarSign size={18} className="text-emerald-400" />
                  <span className="text-sm">$500 - $5,000</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <TrendingUp size={18} className="text-emerald-400" />
                  <span className="text-sm">225% total return</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-amber-500 transition-all">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-white mb-2">Elite</h3>
                <div className="text-4xl font-bold text-amber-400 mb-2">3.0%</div>
                <p className="text-slate-400">daily for 120 days</p>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-slate-300">
                  <DollarSign size={18} className="text-amber-400" />
                  <span className="text-sm">$5,000+</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <TrendingUp size={18} className="text-amber-400" />
                  <span className="text-sm">360% total return</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Why Choose CryptoInvest?</h2>
          <p className="text-xl text-slate-300">Built with your success in mind</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lock className="text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Secure & Transparent</h3>
              <p className="text-slate-300">
                All transactions are recorded and visible. Your funds are always protected.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="text-cyan-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Automated Earnings</h3>
              <p className="text-slate-300">
                Daily returns are calculated and credited automatically. No manual work needed.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="text-emerald-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">24/7 Support</h3>
              <p className="text-slate-300">
                Our team is always available to help you with any questions or concerns.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="text-amber-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Low Minimums</h3>
              <p className="text-slate-300">
                Start investing with as little as $25. Perfect for beginners and experts.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Compound Growth</h3>
              <p className="text-slate-300">
                Reinvest your earnings to maximize returns and accelerate wealth building.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="text-cyan-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Proven Track Record</h3>
              <p className="text-slate-300">
                Trusted by thousands of investors worldwide with consistent returns.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-600 to-cyan-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Earning?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of investors who are already growing their wealth with CryptoInvest
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all flex items-center gap-2 mx-auto shadow-xl"
          >
            Create Your Account
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-slate-400">
            <p>&copy; 2024 CryptoInvest. All rights reserved.</p>
            <p className="text-sm mt-2">Secure USDT Investment Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
