const modes = {
  original: 'Escute a música original com guitarra, voz e acompanhamento.',
  base: 'Toque no lugar da guitarra gravada, com a voz e o acompanhamento.',
  instrumental: 'Ouça o acompanhamento com a guitarra e a voz removidas pela IA.',
  solo: 'Ouça a guitarra isolada pela IA para estudar riffs, frases e solos.'
};

const audio = document.getElementById('demo-audio');
const speed = document.getElementById('demo-speed');
const description = document.getElementById('mode-description');
const status = document.getElementById('demo-status');
const buttons = [...document.querySelectorAll('[data-mode]')];
let selected = 'original';
let pending;

function applySpeed() {
  audio.preservesPitch = true;
  audio.playbackRate = Number(speed.value);
}

speed.addEventListener('change', applySpeed);
audio.addEventListener('loadedmetadata', () => {
  applySpeed();
  if (!pending) return;
  const {position, resume} = pending;
  pending = undefined;
  audio.currentTime = Math.min(position, audio.duration);
  if (resume) audio.play().catch(() => {});
});

audio.addEventListener('error', () => {
  pending = undefined;
  status.textContent = 'Não foi possível carregar este áudio. Selecione um modo para tentar novamente.';
});

for (const button of buttons) {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    if (selected === mode && !audio.error) return;
    pending ??= {
      position: audio.ended ? 0 : audio.currentTime,
      resume: !audio.paused && !audio.ended
    };
    selected = mode;
    status.textContent = '';
    for (const item of buttons) item.setAttribute('aria-pressed', String(item === button));
    description.textContent = modes[mode];
    audio.src = './audio/' + mode + '.mp3';
  });
}
