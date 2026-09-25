import type { Metadata } from 'next'
import Link from 'next/link'
import { T } from '@/components/diversity/diversity-provider'

export const metadata: Metadata = {
  title: 'Planned Maintenance | Precision Sewer Inspections',
  description:
    'Precision Sewer Inspections is briefly offline for planned routine maintenance.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function MaintenancePage() {
  return (
    <>
      <header className="site" data-screen-label="Maintenance Header">
        <div className="container header-inner">
          <Link className="brand-lockup" href="/">
            <div className="mark">
              <img src="/assets/psi_logo.png" alt="Precision Sewer Inspections" />
            </div>
            <div className="name">
              <span className="display">
                Precision <em>Sewer</em> Inspections
              </span>
              <span className="tag"><T>Central Indiana&apos;s Trusted Experts</T></span>
            </div>
          </Link>
          <div className="header-cta">
            <a className="phone" href="tel:3176203858">
              <span className="icon">·</span>(317) 620-3858
            </a>
            <a href="mailto:booking@precisionsewerinspections.com" className="btn btn-onlight">
              <T>Email Us</T>
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="cover" data-screen-label="Maintenance Holding Page">
          <div className="container">
            <div className="cover-grid">
              <div>
                <span className="pill outline-dark"><T>Planned Routine Maintenance</T></span>
                <h1>
                  We&apos;re Tightening Up The <em>Website</em>
                </h1>
                <p className="price-line">
                  <T>Online booking is paused for a few hours while we finish scheduled updates.</T>
                </p>
                <p className="lede-dark">
                  <T>Precision Sewer Inspections is still available by phone and email. If you need
                  to schedule, change, or ask about an inspection, contact us directly and we will
                  take care of it.</T>
                </p>
                <div className="ctas">
                  <a className="btn btn-accent" href="tel:3176203858">
                    Call (317) 620-3858 <span className="arrow">→</span>
                  </a>
                  <a className="btn btn-outline-dark" href="mailto:booking@precisionsewerinspections.com">
                    booking@precisionsewerinspections.com
                  </a>
                </div>
                <div className="trust-grid">
                  <div className="cell">
                    <div className="k"><T>Status</T></div>
                    <div className="v"><T>Planned</T></div>
                  </div>
                  <div className="cell">
                    <div className="k"><T>Booking</T></div>
                    <div className="v"><T>Paused</T></div>
                  </div>
                  <div className="cell">
                    <div className="k"><T>Phone</T></div>
                    <div className="v"><T>Open</T></div>
                  </div>
                  <div className="cell">
                    <div className="k"><T>Reports</T></div>
                    <div className="v"><T>Safe</T></div>
                  </div>
                </div>
              </div>

              <div className="tech-card" aria-hidden="true">
                <div className="placeholder">
                  <span className="stamp"><T>Scheduled Website Maintenance</T></span>
                </div>
                <div className="cert-bump">
                  <div className="ic">✓</div>
                  <div className="text">
                    <div className="a"><T>Routine Work</T></div>
                    <div className="b"><T>Back online shortly</T></div>
                  </div>
                </div>
                <div className="ribbon">
                  <div className="lead">Precision Sewer Inspections</div>
                  <div className="meta">Clean · Accurate · Reliable</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="cover-contact">
          <div className="container row">
            <span>(317) 620-3858</span>
            <span className="dot">·</span>
            <span>booking@precisionsewerinspections.com</span>
            <span className="dot">·</span>
            <span>Indianapolis Metro &amp; Surrounding Areas</span>
          </div>
        </div>

        <section className="final-cta" data-screen-label="Maintenance Contact">
          <h2><T>Need Us Before The Site Is Back?</T></h2>
          <p>
            <T>Call or email and we can handle scheduling, questions, and report support directly.</T>
          </p>
          <div className="btn-row">
            <a className="btn btn-white" href="tel:3176203858">
              <T>Call Now</T> <span className="arrow">→</span>
            </a>
          </div>
          <div className="phone-row">
            <span>·</span>
            <a href="tel:3176203858">(317) 620-3858</a>
            <span className="sep">|</span>
            <span><T>Central Indiana Sewer Inspection</T></span>
          </div>
        </section>
      </main>

      <footer className="site" data-screen-label="Maintenance Footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link className="lockup" href="/">
                <div className="mark">
                  <img src="/assets/psi_logo.png" alt="Precision Sewer Inspections" />
                </div>
                <div className="nm">
                  <div className="a">
                    Precision <em>Sewer</em> Inspections
                  </div>
                  <div className="b"><T>Sanitary Lateral Camera Survey</T></div>
                </div>
              </Link>
              <p>
                <T>Central Indiana&apos;s trusted sewer inspection company. Evidence you can see,
                answers you can trust.</T>
              </p>
              <div className="creds">
                <span className="cred"><T>Fully Insured</T></span>
                <span className="cred">
                  <span className="dot">·</span>InterNACHI Member
                </span>
              </div>
            </div>
            <div>
              <h4><T>Maintenance</T></h4>
              <ul>
                <li><T>Online booking temporarily paused</T></li>
                <li><T>Phone scheduling available</T></li>
                <li><T>Email support available</T></li>
              </ul>
            </div>
            <div>
              <h4><T>Contact</T></h4>
              <ul>
                <li className="contact-line">
                  <span className="label-mini"><T>Phone</T></span>
                  <a href="tel:3176203858">(317) 620-3858</a>
                </li>
                <li className="contact-line">
                  <span className="label-mini"><T>Email</T></span>
                  <a href="mailto:booking@precisionsewerinspections.com">
                    booking@precisionsewerinspections.com
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4><T>Area</T></h4>
              <ul>
                <li className="contact-line">
                  <span className="label-mini"><T>Serving</T></span>
                  <span>Indianapolis Metro &amp; Surrounding Areas</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-areas">
            <h4><T>Serving Central Indiana</T></h4>
            <div className="row">
              <span className="chip">Indianapolis</span>
              <span className="chip">Carmel</span>
              <span className="chip">Fishers</span>
              <span className="chip">Noblesville</span>
              <span className="chip">Westfield</span>
              <span className="chip">Zionsville</span>
              <span className="chip">Greenwood</span>
              <span className="more"><T>+ more</T></span>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="name">
              Precision <em>Sewer</em> Inspections
            </div>
            <div className="tagline">
              Clear<span className="dot">·</span>Accurate<span className="dot">·</span>Reliable
            </div>
            <div className="copy">© 2026 Precision Sewer Inspections. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </>
  )
}
