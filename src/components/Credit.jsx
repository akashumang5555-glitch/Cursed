import heart from '../assets/images/pixel-heart.svg'

// Home page sign-off, bottom centre, above the splash cursor (z 50)
export default function Credit() {
  return (
    <p className="credit" data-dive="fade">
      Designed and built with
      <img src={heart} alt="love" width="17" height="15" />
      by{' '}
      <a href="https://akashux.framer.website/" target="_blank" rel="noopener noreferrer">
        Akash
      </a>
    </p>
  )
}
