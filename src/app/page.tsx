import Link from "next/link";
import { Sparkles, Calendar, Star, ArrowRight, Phone, MapPin, Clock, Mail, Globe } from "lucide-react";
import { getBusinessSettings } from "../lib/firestore/businessSettings/businessSettings";
import { BusinessSettings } from "../types/models.type";

export default async function HomePage() {
  let businessSettings: BusinessSettings | null = null;
  
  try {
    businessSettings = await getBusinessSettings('default');
  } catch (error) {
    console.error('Error fetching business settings:', error);
  }

  const formatBusinessHours = (businessHours: BusinessSettings['businessHours'] | undefined) => {
    if (!businessHours) return [];
    
    const daysMap: { [key: string]: string } = {
      monday: 'Lunes',
      tuesday: 'Martes', 
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };

    return Object.entries(businessHours)
      .filter(([_, hours]) => hours?.enabled)
      .map(([day, hours]) => ({
        day: daysMap[day] || day,
        hours: `${hours.openTime} - ${hours.closeTime}`
      }));
  };

  const businessHours = formatBusinessHours(businessSettings?.businessHours);
  const businessName = businessSettings?.name || 'Salón de Uñas Elegancia';
  const businessPhone = businessSettings?.phone || '+54 11 1234-5678';
  const businessAddress = businessSettings?.address || 'Av. Corrientes 1234, CABA';
  const businessEmail = businessSettings?.email || 'info@salonelegancia.com';
  const businessWebsite = businessSettings?.website;
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-100/20 to-rose-100/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center fade-in">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full shadow-lg">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              {businessName}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              {businessSettings?.description ||
                "Transformamos tus uñas en obras de arte. Reservá tu turno online y descubrí la experiencia más elegante en cuidado de uñas."}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/reservation"
                className="btn-primary group text-lg px-8 py-4"
              >
                Reservar Turno
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/login" className="btn-secondary text-lg px-8 py-4">
                Ingresar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 slide-up">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Nuestros Servicios
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ofrecemos una amplia gama de servicios para el cuidado y
              embellecimiento de tus uñas
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Manicura Clásica",
                description:
                  "Cuidado completo de tus uñas con técnicas tradicionales y productos de alta calidad",
                icon: "💅",
              },
              {
                title: "Nail Art",
                description:
                  "Diseños únicos y personalizados que reflejan tu estilo y personalidad",
                icon: "🎨",
              },
              {
                title: "Tratamientos",
                description:
                  "Cuidados especializados para fortalecer y nutrir tus uñas naturales",
                icon: "✨",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="card-elegant p-8 text-center group hover:scale-105 transition-transform duration-300"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="font-display text-2xl font-semibold text-gray-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-gradient-to-r from-amber-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              ¿Por qué elegirnos?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Star className="w-8 h-8" />,
                title: "Calidad Premium",
                description: "Productos de las mejores marcas internacionales",
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: "Reserva Online",
                description: "Sistema fácil y rápido de reservas 24/7",
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: "Puntualidad",
                description: "Respetamos tu tiempo, siempre puntuales",
              },
              {
                icon: <MapPin className="w-8 h-8" />,
                title: "Ubicación Central",
                description: "Fácil acceso y estacionamiento disponible",
              },
            ].map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex p-4 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-xl text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-amber-600 to-rose-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            ¿Lista para lucir uñas perfectas?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Reservá tu turno ahora y experimentá el mejor cuidado de uñas en la
            ciudad
          </p>
          <Link
            href="/reservation"
            className="inline-flex items-center bg-white text-gray-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors duration-300 group"
          >
            Reservar Ahora
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-display text-2xl font-bold mb-4">
                {businessName}
              </h3>
              <p className="text-gray-400 mb-4">
                {businessSettings?.description ||
                  "Tu destino para el cuidado profesional de uñas"}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Contacto</h4>
              <div className="space-y-2 text-gray-400">
                {businessPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{businessPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {typeof businessAddress === "string"
                      ? businessAddress
                      : `${businessAddress?.street}, ${businessAddress?.city}`}
                  </span>
                </div>
                {businessEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{businessEmail}</span>
                  </div>
                )}
                {businessWebsite && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a
                      href={businessWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      {businessWebsite.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Horarios</h4>
              <div className="space-y-1 text-gray-400">
                {businessHours.length > 0 ? (
                  businessHours.map((schedule, index) => (
                    <p key={index}>
                      {schedule.day}: {schedule.hours}
                    </p>
                  ))
                ) : (
                  <>
                    <p>Lunes a Viernes: 9:00 - 18:00</p>
                    <p>Sábados: 9:00 - 16:00</p>
                    <p>Domingos: Cerrado</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 {businessName}. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
