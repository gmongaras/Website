import { profile } from '../../data'

const Footer = () => (
  <footer id="footer" className="section py-12 border-t border-white/10 scroll-mt-20">
    <div className="flex justify-center">
      <div className="text-white/60 text-sm">
        <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
      </div>
    </div>
  </footer>
)

export default Footer
