import { Award, CheckCircle, Mail, MapPin, Phone, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { COMPANY_INFO } from "@/lib/constants";
import { SERVICE_AREA_LINKS } from "@/lib/service-areas";
import { T } from "@/components/diversity/diversity-provider";

export default function Footer() {
	return (
		<footer className="bg-primary-900 text-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
					{/* Company Info */}
					<div>
						<Link href="/" className="flex items-center gap-3 mb-4">
							<div className="relative w-12 h-12 bg-white rounded-lg p-1">
								<Image
									src="/logo.png"
									alt={COMPANY_INFO?.name ?? "Company Logo"}
									fill
									className="object-contain"
								/>
							</div>
							<div>
								<span className="font-heading font-bold text-white text-lg">
									Precision
								</span>
								<span className="block text-xs text-primary-300 -mt-1">
									Sewer Inspections
								</span>
							</div>
						</Link>
						<p className="text-primary-200 text-sm mb-4">
							<T>
								Sewer inspections across Central Indiana.
								Video evidence, clear reporting, and practical guidance when you ask.
							</T>
						</p>
						<p className="text-primary-200 text-sm mb-4"><Link href="/inspection-and-service" className="underline hover:text-white"><T>PSI + Indiana Drain Company: inspection and service, connected.</T></Link></p>
						<div className="flex gap-4">
							<div className="flex items-center gap-1 text-xs text-primary-300">
								<Shield className="w-4 h-4" />
								<span><T>Fully Insured</T></span>
							</div>
							<div className="flex items-center gap-1 text-xs text-primary-300">
								<Award className="w-4 h-4" />
								<span>InterNACHI Member</span>
							</div>
						</div>
					</div>

					{/* Quick Links */}
					<div>
						<h4 className="font-heading font-bold text-lg mb-4"><T>Services</T></h4>
						<ul className="space-y-2">
							<li>
								<Link
									href="/services"
									className="text-primary-200 hover:text-white transition-colors text-sm"
								>
									<T>Sewer Scope Inspection</T>
								</Link>
							</li>
							<li>
								<Link
									href="/services"
									className="text-primary-200 hover:text-white transition-colors text-sm"
								>
									<T>Commercial Inspections</T>
								</Link>
							</li>
							<li>
								<Link
									href="/services"
									className="text-primary-200 hover:text-white transition-colors text-sm"
								>
									<T>Real Estate Partners</T>
								</Link>
							</li>
							<li>
								<Link
									href="/realtors"
									className="text-primary-200 hover:text-white transition-colors text-sm"
								>
									<T>For Realtors</T>
								</Link>
							</li>
							<li>
								<Link
									href="/pricing"
									className="text-primary-200 hover:text-white transition-colors text-sm"
								>
									<T>Pricing</T>
								</Link>
							</li>
						</ul>
					</div>

					{/* Company */}
					<div>
						<h4 className="font-heading font-bold text-lg mb-4"><T>Company</T></h4>
						<ul className="space-y-2">
							<li>
								<Link
									href="/about"
									className="text-primary-200 hover:text-white transition-colors text-sm"
								>
									<T>About Us</T>
								</Link>
							</li>
							<li>
								<Link
									href="/resources"
									className="text-primary-200 hover:text-white transition-colors text-sm"
								>
									<T>Resources & Blog</T>
								</Link>
							</li>
							<li>
								<Link
									href="/faq"
									className="text-primary-200 hover:text-white transition-colors text-sm"
								>
									<T>FAQ</T>
								</Link>
							</li>
							<li>
								<Link
									href="/contact"
									className="text-primary-200 hover:text-white transition-colors text-sm"
								>
									<T>Contact</T>
								</Link>
							</li>
							<li>
								<Link
									href="/support"
									className="text-primary-200 hover:text-white transition-colors text-sm"
								>
									<T>Support & Terms</T>
								</Link>
							</li>
							<li>
								<Link
									href="/privacy"
									className="text-primary-200 hover:text-white transition-colors text-sm"
								>
									<T>Privacy Policy</T>
								</Link>
							</li>
						</ul>
					</div>

					{/* Contact Info */}
					<div className="lg:col-span-1 lg:min-w-[280px]">
						<h4 className="font-heading font-bold text-lg mb-4 pl-6">
							<T>Contact Us</T>
						</h4>
						<ul className="space-y-3">
							<li>
								<a
									href={`tel:${COMPANY_INFO?.phoneRaw ?? ""}`}
									className="flex items-center gap-2 text-primary-200 hover:text-white transition-colors text-sm"
								>
									<Phone className="w-4 h-4 flex-shrink-0" />
									{COMPANY_INFO?.phone ?? ""}
								</a>
							</li>
							<li>
								<a
									href={`mailto:${COMPANY_INFO?.email ?? ""}`}
									className="flex items-center gap-2 text-primary-200 hover:text-white transition-colors text-sm whitespace-nowrap"
								>
									<Mail className="w-4 h-4 flex-shrink-0" />
									{COMPANY_INFO?.email ?? ""}
								</a>
							</li>
							<li>
								<a
									href={COMPANY_INFO?.googleMapsUrl ?? "#"}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-start gap-2 text-primary-200 hover:text-white transition-colors text-sm"
								>
									<MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
									<span>
										{COMPANY_INFO?.serviceAreaDisplay ??
											"Indianapolis Metro & Surrounding Areas"}
									</span>
								</a>
							</li>
						</ul>
					</div>
				</div>

				{/* Service Areas — linked so every page points crawlers + LLMs at the city pages */}
				<div className="mt-10 pt-8 border-t border-primary-800">
					<h4 className="font-heading font-bold text-sm mb-3">
						<Link href="/areas" className="hover:text-white transition-colors">
							<T>Sewer Inspection Service Areas</T>
						</Link>
					</h4>
					<div className="flex flex-wrap gap-2">
						{SERVICE_AREA_LINKS.map((area) => (
							<Link
								key={area.slug}
								href={`/sewer-inspection/${area.slug}`}
								className="text-xs text-primary-300 bg-primary-800 px-2 py-1 rounded hover:bg-primary-700 hover:text-white transition-colors"
							>
								{area.name}
							</Link>
						))}
						<Link
							href="/areas"
							className="text-xs text-primary-300 px-2 py-1 hover:text-white transition-colors self-center"
						>
							<T>View all areas</T>
						</Link>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="mt-8 pt-8 border-t border-primary-800 flex flex-col sm:flex-row justify-between items-center gap-4">
					<p className="text-primary-300 text-sm">
						© {new Date().getFullYear()} {COMPANY_INFO?.name ?? ""}.{" "}
						<T>All rights reserved.</T>
					</p>
					<p className="text-primary-300 text-xs">
						<T>Serving all of Central Indiana with pride.</T>
					</p>
				</div>
			</div>
		</footer>
	);
}
