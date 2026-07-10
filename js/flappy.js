function novoElemento(tagName, className) {
    const e = document.createElement(tagName)
    e.className = className
    return e
}


const AudioMotor = (() => {
    let ctx

    const getCtx = () => {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
        if (ctx.state === 'suspended') ctx.resume()
        return ctx
    }

    const tocar = (freq, duracao, tipo = 'square', volume = 0.15) => {
        try {
            const audioCtx = getCtx()
            const osc = audioCtx.createOscillator()
            const gain = audioCtx.createGain()
            osc.type = tipo
            osc.frequency.value = freq
            gain.gain.value = volume
            osc.connect(gain)
            gain.connect(audioCtx.destination)
            osc.start()
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duracao)
            osc.stop(audioCtx.currentTime + duracao)
        } catch (e) {
            // ambiente sem suporte a Web Audio (ex.: testes headless) — ignora silenciosamente
        }
    }

    return {
        pular: () => tocar(700, 0.08, 'square', 0.12),
        pontuar: () => {
            tocar(880, 0.08, 'square', 0.12)
            setTimeout(() => tocar(1175, 0.1, 'square', 0.12), 80)
        },
        colidir: () => tocar(120, 0.35, 'sawtooth', 0.2)
    }
})()


function Barreira(reversa = false) {
    this.elemento = novoElemento('div', 'barreira')

    const borda = novoElemento('div', 'borda')
    const corpo = novoElemento('div', 'corpo')
    this.elemento.appendChild(reversa ? corpo : borda)
    this.elemento.appendChild(reversa ? borda : corpo)

    this.setAltura = altura => corpo.style.height = `${altura}px`
}


function ParDeBarreiras(altura, abertura, x) {
    this.elemento = novoElemento('div', 'par-de-barreiras')

    this.superior = new Barreira(true)
    this.inferior = new Barreira(false)

    this.elemento.appendChild(this.superior.elemento)
    this.elemento.appendChild(this.inferior.elemento)


    this.sortearAbertura = () => {
        const alturaSuperior = Math.random() * (altura - abertura)
        const alturaInferior = altura - abertura - alturaSuperior
        this.superior.setAltura(alturaSuperior)
        this.inferior.setAltura(alturaInferior)
    }

    this.getX = () => parseInt(this.elemento.style.left.split('px')[0])
    this.setX = x => this.elemento.style.left = `${x}px`
    this.getLargura = () => this.elemento.clientWidth

    this.sortearAbertura()
    this.setX(x)
}

let deslocamento

function Barreiras(altura, largura, abertura, espaco, notificarPonto) {
    this.pares = [
        new ParDeBarreiras(altura, abertura, largura),
        new ParDeBarreiras(altura, abertura, largura + espaco),
        new ParDeBarreiras(altura, abertura, largura + espaco * 2),
        new ParDeBarreiras(altura, abertura, largura + espaco * 3)
    ]

    this.setDesloc = num => {
        deslocamento = num
    }

    this.animar = () => {
        this.pares.forEach(par => {
            par.setX(par.getX() - deslocamento)

            //quando o elemento sair da área do jogo
            if (par.getX() < -par.getLargura()) {
                par.setX(par.getX() + espaco * this.pares.length)
                par.sortearAbertura()
            }

            const meio = largura / 2
            const cruzouOMeio = par.getX() + deslocamento >= meio
                && par.getX() < meio
            if (cruzouOMeio) notificarPonto()
        })
    }
}


function Passaro(alturaJogo, areaDoJogo) {
    let voando = false

    this.elemento = novoElemento('img', 'passaro')
    this.elemento.src = 'imgs/passaro.png'

    this.getY = () => parseInt(this.elemento.style.bottom.split('px')[0])

    this.setY = y => this.elemento.style.bottom = `${y}px`

    const ativar = e => {
        if (e.type === 'keydown' && e.code !== 'Space') return
        e.preventDefault()
        if (!voando) AudioMotor.pular()
        voando = true
    }
    const desativar = e => {
        if (e.type === 'keyup' && e.code !== 'Space') return
        voando = false
    }

    window.addEventListener('keydown', ativar)
    window.addEventListener('keyup', desativar)
    areaDoJogo.addEventListener('mousedown', ativar)
    areaDoJogo.addEventListener('mouseup', desativar)
    areaDoJogo.addEventListener('mouseleave', desativar)
    areaDoJogo.addEventListener('touchstart', ativar)
    areaDoJogo.addEventListener('touchend', desativar)

    this.pausar = () => {
        window.removeEventListener('keydown', ativar)
        window.removeEventListener('keyup', desativar)
        areaDoJogo.removeEventListener('mousedown', ativar)
        areaDoJogo.removeEventListener('mouseup', desativar)
        areaDoJogo.removeEventListener('mouseleave', desativar)
        areaDoJogo.removeEventListener('touchstart', ativar)
        areaDoJogo.removeEventListener('touchend', desativar)
    }

    this.animar = () => {
        const novoY = this.getY() + (voando ? 8 : -5)
        const alturaMaxima = alturaJogo - this.elemento.clientHeight

        if (voando) this.elemento.className = "passaro-voando"
        else this.elemento.className = "passaro"

        if (novoY <= 0) {
            this.setY(0)
        } else if (novoY >= alturaMaxima) {
            this.setY(alturaMaxima)
        } else {
            this.setY(novoY)
        }
    }

    this.setY(alturaJogo / 2)
}


function Progresso() {
    this.elemento = novoElemento('span', 'progresso')
    const desloc = new Barreiras()
    this.atualizarPonto = pontos => {
        this.elemento.innerHTML = pontos
        if (pontos === 0) {
            desloc.setDesloc(5)
        }
        else if (pontos === 10) {
            desloc.setDesloc(7)
        }
        else if (pontos === 15) {
            desloc.setDesloc(9)
        }
        else if (pontos === 30) {
            desloc.setDesloc(9)
        }
        else if (pontos === 35) {
            desloc.setDesloc(10)
        }
        else if (pontos === 40) {
            desloc.setDesloc(13)
        }
    }

    this.atualizarPonto(0)
}


function estaoSobrePostos(elemA, elemB) {
    const a = elemA.getBoundingClientRect()
    const b = elemB.getBoundingClientRect()

    const horizon = a.left + a.width >= b.left && b.left + b.width >= a.left
    const vertical = a.top + a.height >= b.top && b.top + b.height >= a.top

    return horizon && vertical
}

function colidiu(passaro, barreiras) {
    let colidiu = false

    barreiras.pares.forEach(parDeBarreiras => {
        if (!colidiu) {
            const superior = parDeBarreiras.superior.elemento
            const inferior = parDeBarreiras.inferior.elemento

            colidiu = estaoSobrePostos(passaro.elemento, superior) ||
                      estaoSobrePostos(passaro.elemento, inferior)
        }
    })

    return colidiu
}


const CHAVE_RECORDE = 'flappy-bird-recorde'
const lerRecorde = () => parseInt(localStorage.getItem(CHAVE_RECORDE)) || 0

function FlappyBird() {
    let pontos = 0

    const areaDoJogo = document.querySelector('[wm-flappy]')
    const altura = areaDoJogo.clientHeight
    const largura = areaDoJogo.clientWidth

    const progresso = new Progresso()
    const recorde = novoElemento('span', 'recorde')
    recorde.innerHTML = `Recorde: ${lerRecorde()}`

    const barreiras = new Barreiras(altura, largura, 300, 400, () => {
        progresso.atualizarPonto(++pontos)
        AudioMotor.pontuar()
    })
    const passaro = new Passaro(altura, areaDoJogo)

    areaDoJogo.appendChild(progresso.elemento)
    areaDoJogo.appendChild(recorde)
    areaDoJogo.appendChild(passaro.elemento)
    barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento))

    const rodar = () => {
        const temporizador = setInterval(() => {
            barreiras.animar()
            passaro.animar()

            if (colidiu(passaro, barreiras)) {
                clearInterval(temporizador)
                passaro.pausar()
                AudioMotor.colidir()

                const bateuRecorde = pontos > lerRecorde()
                if (bateuRecorde) localStorage.setItem(CHAVE_RECORDE, pontos)

                const msg = novoElemento('div', 'msg')
                const cont = novoElemento('h1', '')
                const pontuacao = novoElemento('p', 'pontuacao')
                const botaoReiniciar = novoElemento('button', 'reiniciar')

                cont.innerHTML = "Você Perdeu!"
                pontuacao.innerHTML = bateuRecorde
                    ? `Novo recorde: ${pontos}!`
                    : `Pontos: ${pontos} — Recorde: ${lerRecorde()}`
                botaoReiniciar.innerHTML = 'Jogar novamente'
                botaoReiniciar.onclick = () => {
                    areaDoJogo.innerHTML = ''
                    new FlappyBird().start()
                }

                msg.appendChild(cont)
                msg.appendChild(pontuacao)
                msg.appendChild(botaoReiniciar)

                areaDoJogo.appendChild(msg)
            }

        }, 20)
    }

    this.start = () => {
        const inicio = novoElemento('div', 'msg inicio')
        const titulo = novoElemento('h1', '')
        const instrucao = novoElemento('p', 'pontuacao')

        titulo.innerHTML = 'Flappy Bird'
        instrucao.innerHTML = 'Pressione ESPAÇO, clique ou toque para começar'

        inicio.appendChild(titulo)
        inicio.appendChild(instrucao)
        areaDoJogo.appendChild(inicio)

        const iniciarJogo = e => {
            if (e.type === 'keydown' && e.code !== 'Space') return

            window.removeEventListener('keydown', iniciarJogo)
            areaDoJogo.removeEventListener('mousedown', iniciarJogo)
            areaDoJogo.removeEventListener('touchstart', iniciarJogo)

            inicio.remove()
            rodar()
        }

        window.addEventListener('keydown', iniciarJogo)
        areaDoJogo.addEventListener('mousedown', iniciarJogo)
        areaDoJogo.addEventListener('touchstart', iniciarJogo)
    }
}

new FlappyBird().start()
