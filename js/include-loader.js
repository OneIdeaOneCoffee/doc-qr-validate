document.querySelectorAll('[data-include]').forEach(async (el) => {
  const path = el.getAttribute('data-include');
  try {
    const res = await fetch(path);
    if (res.ok) el.innerHTML = await res.text();
    else el.innerHTML = "<!-- Falha ao carregar: " + path + " -->";
  } catch (err) {
    el.innerHTML = "<!-- Erro: " + err.message + " -->";
  }
});
