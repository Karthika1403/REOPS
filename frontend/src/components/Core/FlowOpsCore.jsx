import OrbitingNodes from "../Effects/OrbitingNodes";

function FlowOpsCore() {
  return (
    <div className="relative flex items-center justify-center">

      {/* Orbiting Nodes */}
      <OrbitingNodes />

      {/* Outer Ring */}
      <div
        className="
        absolute
        w-[280px]
        h-[280px]
        rounded-full
        border
        border-cyan-500/20
        animate-spin
        "
        style={{
          animationDuration: "25s",
        }}
      />

      {/* Inner Ring */}
      <div
        className="
        absolute
        w-[320px]
        h-[320px]
        rounded-full
        border
        border-purple-500/20
        animate-spin
        "
        style={{
          animationDuration: "18s",
          animationDirection: "reverse",
        }}
      />

      {/* Core */}
      <div
        id="flowopsCore"
        className="
        relative
        w-[240px]
        h-[240px]
        rounded-full
        flex
        flex-col
        items-center
        justify-center
        text-white
        overflow-hidden
        z-20
        "
        style={{
          background:
            "linear-gradient(135deg,#8b5cf6,#7c3aed,#3b82f6)",
          boxShadow:
            "0 0 80px rgba(139,92,246,.8)",
        }}
      >
        <div className="relative z-20 text-center">
          <div className="text-2xl font-extrabold tracking-wider">
            FLOWOPS
          </div>

          <div className="text-cyan-300 text-xl mt-1">
            AI
          </div>

          <div className="mt-3 text-sm text-white/90">
            Autonomous Workflow Intelligence
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5">
            <div>
              <div className="text-cyan-300 font-bold text-2xl">
                12
              </div>
              <div className="text-[10px] uppercase tracking-wider">
                Docs
              </div>
            </div>

            <div>
              <div className="text-purple-300 font-bold text-2xl">
                24
              </div>
              <div className="text-[10px] uppercase tracking-wider">
                Tasks
              </div>
            </div>

            <div>
              <div className="text-green-300 font-bold text-xl">
                99.8%
              </div>
              <div className="text-[10px] uppercase tracking-wider">
                Success
              </div>
            </div>
          </div>

          <div className="mt-5 text-green-400 font-bold text-base">
            ● ONLINE
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlowOpsCore;