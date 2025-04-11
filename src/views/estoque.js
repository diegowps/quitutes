// Transição dos formulários

function mostrarFormulario(id) {
    document.querySelectorAll(".form-section").forEach(sec => {
      sec.classList.add("hidden");
    });
  
    const formSelecionado = document.getElementById(id);
    if (formSelecionado) {
      formSelecionado.classList.remove("hidden");
    }
  }
  

