type MetricCardProps = {
  label: string;
  value: string;
  sublabel?: string;
};

function MetricCard({ label, value, sublabel }: MetricCardProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 shadow border border-slate-700/50 flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-slate-400 font-medium">{label}</span>
      <span className="text-3xl font-bold text-white">{value}</span>
      {sublabel && <span className="text-xs text-slate-500">{sublabel}</span>}
    </div>
  );
}

type ActivityItemProps = {
  title: string;
  meta: string;
  time: string;
};

function ActivityItem({ title, meta, time }: ActivityItemProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-b-0">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white">{title}</span>
        <span className="text-xs text-slate-400">{meta}</span>
      </div>
      <span className="text-xs text-slate-500 whitespace-nowrap ml-4">{time}</span>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Welcome back</h2>
        <p className="text-slate-400 text-sm mt-1">Here's how your training is tracking.</p>
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="This Week" value="3" sublabel="sessions" />
        <MetricCard label="Streak" value="5" sublabel="days" />
        <MetricCard label="Top Technique" value="Triangle" sublabel="8 times drilled" />
        <MetricCard label="Belt" value="Blue" sublabel="3 stripes" />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-800 rounded-xl p-5 shadow border border-slate-700/50">
          <h3 className="text-white font-bold mb-2">Recent Activity</h3>
          <div className="flex flex-col">
            <ActivityItem title="Gi Session" meta="Triangle, Armbar drilled" time="Today" />
            <ActivityItem title="Sparring Roll" meta="Landed: Rear naked choke" time="Yesterday" />
            <ActivityItem title="No-Gi Session" meta="Single-leg takedown drilled" time="3 days ago" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 shadow border border-slate-700/50 flex flex-col items-center justify-center text-center gap-3">
          <p className="text-slate-300 text-sm">Ready to log today's training?</p>
          <button
            type="button"
            className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg py-2 transition-colors"
          >
            Log Session
          </button>
        </div>
      </section>
    </div>
  );
}