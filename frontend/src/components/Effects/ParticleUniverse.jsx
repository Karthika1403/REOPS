function ParticleUniverse() {
  const stars = Array.from({ length: 250 });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Stars */}
      {stars.map((_, i) => (
        <div
          key={i}
          className={`star ${
            i % 3 === 0
              ? "star-cyan"
              : i % 3 === 1
              ? "star-purple"
              : "star-white"
          }`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${2 + Math.random() * 4}s`,
          }}
        />
      ))}

      {/* Shooting Stars */}
      <div className="meteor meteor-1" />
      <div className="meteor meteor-2" />
      <div className="meteor meteor-3" />
      <div className="meteor meteor-4" />
      <div className="meteor meteor-5" />

      {/* Purple Nebula */}
      <div className="nebula-purple" />

      {/* Cyan Nebula */}
      <div className="nebula-cyan" />
    </div>
  );
}

export default ParticleUniverse;