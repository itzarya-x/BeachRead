export function spawnSakuraParticles(count = 18) {
    if (typeof document === "undefined") return;
    const layer = document.querySelector(".sakura-particle-layer");
    if (!layer) return;

    const particles = Array.from({ length: count }, () => {
        const el = document.createElement("span");
        el.className = "sakura-particle";
        el.style.left = `${6 + Math.random() * 88}%`;
        el.style.animationDelay = `${Math.random() * 0.3}s`;
        el.style.animationDuration = `${1 + Math.random() * 0.9}s`;
        return el;
    });

    particles.forEach(particle => layer.appendChild(particle));
    window.setTimeout(() => {
        particles.forEach(particle => particle.remove());
    }, 2100);
}
