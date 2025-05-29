import "./App.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/api";

function Home({ user }) {
  const [upcomingData, setUpcomingData] = useState({
    bookings: [],
    expeditions: [],
    schools: [],
    athleteIds: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // Wrapping each API call in a separate try-catch to handle individual endpoint failures
        const bookingsData = await fetchWithErrorHandling("/katafigio", 
          res => {
            const bookings = res.data || [];
            return bookings
              .filter(b => new Date(b.arrival) >= new Date())
              .sort((a, b) => new Date(a.arrival) - new Date(b.arrival))
              .slice(0, 2); // Changed to 2 items instead of 3
          });
        
        const expeditionsData = await fetchWithErrorHandling("/eksormiseis", 
          res => {
            const expeditions = res.data || [];
            return expeditions
              .filter(e => new Date(e.hmerominia_anaxorisis) >= new Date())
              .sort((a, b) => new Date(a.hmerominia_anaxorisis) - new Date(b.hmerominia_anaxorisis))
              .slice(0, 2); // Changed to 2 items instead of 3
          });
        
        const schoolsData = await fetchWithErrorHandling("/sxoles", 
          res => {
            const schools = res.data || [];
            
            // Process schools to find earliest location date for each
            const schoolsWithDate = schools.map(school => {
              let earliestDate = null;
              
              // Parse topothesia to find earliest date
              if (school.topothesies) {
                try {
                  const locations = typeof school.topothesies === 'string' 
                    ? JSON.parse(school.topothesies) 
                    : school.topothesies;
                    
                  if (Array.isArray(locations)) {
                    locations.forEach(loc => {
                      if (loc.start) {
                        const locDate = new Date(loc.start);
                        if (!earliestDate || locDate < earliestDate) {
                          earliestDate = locDate;
                        }
                      }
                    });
                  }
                } catch (e) {
                  console.error("Error parsing topothesies for school:", school.id_sxolis);
                }
              }
              
              // If no date found in locations, use hmerominia_enarksis as fallback
              if (!earliestDate && school.hmerominia_enarksis) {
                earliestDate = new Date(school.hmerominia_enarksis);
              }
              
              return {
                ...school,
                earliestDate: earliestDate
              };
            });
            
            // Filter and sort schools by earliest date
            return schoolsWithDate
              .filter(s => s.earliestDate && s.earliestDate >= new Date())
              .sort((a, b) => a.earliestDate - b.earliestDate)
              .slice(0, 2); // Changed to 2 items instead of 3
          });
        
        // Updated to use correct field name hmerominia_liksis_deltiou
        const athletesData = await fetchWithErrorHandling("/athlites/athletes", 
          res => {
            const athletes = res.data || [];
            // Make sure we're filtering by the correct field name
            return athletes
              .filter(a => a.hmerominia_liksis_deltiou && new Date(a.hmerominia_liksis_deltiou) >= new Date())
              .sort((a, b) => new Date(a.hmerominia_liksis_deltiou) - new Date(b.hmerominia_liksis_deltiou))
              .slice(0, 2); // Changed to 2 items instead of 3
          });
        
        setUpcomingData({
          bookings: bookingsData,
          expeditions: expeditionsData,
          schools: schoolsData,
          athleteIds: athletesData
        });
      } catch (error) {
        console.error("Σφάλμα κατά τη φόρτωση δεδομένων dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    
    // Helper function to handle API calls with graceful error handling
    async function fetchWithErrorHandling(endpoint, processFunction) {
      try {
        const response = await api.get(endpoint);
        return processFunction(response);
      } catch (error) {
        console.log(`Σφάλμα κατά την κλήση του endpoint ${endpoint}:`, error);
        return [];
      }
    }
    
    fetchDashboardData();
  }, []);

  if (!user) {
    return <p>Δεν έχετε συνδεθεί.</p>;
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Σύστημα Ηλεκτρονικής Γραμματείας Ε.Ο.Σ Πατρών</h1>
      </header>

      <div className="categories">
        <Link to="/eksormiseis" className="category category-1" style={{ textDecoration: 'none' }}>
          <div>
            <h2 className="category-title" style={{ textDecoration: 'none' }}>Εξορμήσεις</h2>
            <p>Προβολή Εξορμήσεων</p>
            <p>Δημιουργία Εξόρμησης</p>
          </div>
        </Link>

        <div className="category category-2">
          <h2 className="category-title" style={{ textDecoration: 'none' }}>Πρόσωπα</h2>
          <div>
            <Link to="/melitousillogou">
              <p style={{ cursor: "pointer", textDecoration: "underline" }}>
                Προβολή μελών του συλλόγου
              </p>
            </Link>
            <Link to="/athlites">
              <p style={{ cursor: "pointer", textDecoration: "underline" }}>
                Προβολή αθλητών
              </p>
            </Link>
            <Link to="/meliallwnsillogwn">
              <p style={{ cursor: "pointer", textDecoration: "underline" }}>
                Προβολή μελών άλλων συλλόγων
              </p>
            </Link>
            <Link to="/epafes">
              <p style={{ cursor: "pointer", textDecoration: "underline" }}>
                Προβολή Επαφών
              </p>
            </Link>
          </div>
        </div>

        <Link to="/katafigio" className="category category-3" style={{ textDecoration: 'none' }}>
          <div>
            <h2 className="category-title" style={{ textDecoration: 'none' }}>Καταφύγιο</h2>
            <p>Προβολή Κρατήσεων</p>
            <p>Δημιουργία Κρατήσεων</p>
          </div>
        </Link>

        <Link to="/sxoles" className="category category-4" style={{ textDecoration: 'none' }}>
          <div>
            <h2 className="category-title" style={{ textDecoration: 'none' }}>Σχολές και εκπαιδευτές</h2>
            <p>Προβολή Σχολών και εκπαιδευτών</p>
            <p>Δημιουργία Εξόρμησης</p>
          </div>
        </Link>

        <Link to="/eksoplismos" className="category category-5" style={{ textDecoration: 'none' }}>
          <div>
            <h2 className="category-title" style={{ textDecoration: 'none' }}>Εξοπλισμός και δανεισμοί</h2>
            <p>Προβολή δανεισμών και εξοπλισμού</p>
            <p>Δημιουργία δανεισμού</p>
          </div>
        </Link>
      </div>
      
      {/* Dashboard section with upcoming events - Horizontal layout with reduced height */}
      <div className="dashboard" style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        minHeight: '250px', // Reduced height since we're showing fewer items
        maxWidth: '100%', // Use the full width
      }}>
        <h2 style={{ 
          borderBottom: '2px solid #1976d2', 
          paddingBottom: '5px', 
          marginBottom: '15px', 
          color: '#1976d2',
          fontSize: '1.2rem' 
        }}>
          Προσεχή Γεγονότα και Ειδοποιήσεις
        </h2>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          flexWrap: 'wrap', 
          gap: '15px', 
          justifyContent: 'space-between'
        }}>
          {/* Upcoming Bookings */}
          <DashboardCard 
            type="bookings"
            title="Προσεχείς Κρατήσεις Καταφυγίου" 
            items={loading ? [] : (upcomingData.bookings.map(booking => ({
              id: booking.id,
              name: booking.contactName || "Άγνωστος",
              date: new Date(booking.arrival).toLocaleDateString('el-GR'),
              info: booking.shelterName || "Καταφύγιο"
            })))}
            loading={loading}
            emptyMessage="Δεν υπάρχουν προσεχείς κρατήσεις"
            linkTo="/katafigio"
          />
          
          {/* Upcoming Expeditions - with clickable titles */}
          <DashboardCard 
            type="expeditions"
            title="Προσεχείς Εξορμήσεις" 
            items={loading ? [] : (upcomingData.expeditions.map(expedition => ({
              id: expedition.id_eksormisis || expedition.id,
              name: expedition.titlos || "Χωρίς τίτλο",
              date: new Date(expedition.hmerominia_anaxorisis).toLocaleDateString('el-GR'),
              info: expedition.proorismos || "Άγνωστη τοποθεσία"
            })))}
            loading={loading}
            emptyMessage="Δεν υπάρχουν προσεχείς εξορμήσεις"
            linkTo="/eksormiseis"
          />
          
          {/* Upcoming Schools - sorted by earliest location date */}
          <DashboardCard 
            type="schools"
            title="Προσεχείς Σχολές" 
            items={loading ? [] : (upcomingData.schools.map(school => ({
              id: school.id_sxolis || school.id,
              name: `${school.klados || ''} ${school.epipedo || ''}`.trim() || "Χωρίς τίτλο",
              date: school.earliestDate ? school.earliestDate.toLocaleDateString('el-GR') : "-",
              info: school.athlima || "Γενική"
            })))}
            loading={loading}
            emptyMessage="Δεν υπάρχουν προσεχείς σχολές"
            linkTo="/sxoles"
          />
          
          {/* Expiring Athlete IDs - using correct field names */}
          <DashboardCard 
            type="athletes"
            title="Επόμενα Δελτία Αθλητών που Λήγουν" 
            items={loading ? [] : (upcomingData.athleteIds.map(athlete => ({
              id: athlete.id_athliti || athlete.id,
              name: `${athlete.epitheto || ''} ${athlete.onoma || ''}`.trim() || 
                    `${athlete.lastName || ''} ${athlete.firstName || ''}`.trim() || 
                    athlete.name || 
                    "Άγνωστος",
              date: athlete.hmerominia_liksis_deltiou ? 
                    new Date(athlete.hmerominia_liksis_deltiou).toLocaleDateString('el-GR') : 
                    "Άγνωστη",
              info: `Αρ. Δελτίου: ${athlete.arithmos_deltiou || "-"}`
            })))}
            loading={loading}
            emptyMessage="Δεν υπάρχουν δελτία που λήγουν σύντομα"
            linkTo="/athlites"
          />
        </div>
      </div>
    </div>
  );
}

// Dashboard card component - adjusted for fewer items
function DashboardCard({ type, title, items, loading, emptyMessage, linkTo }) {
  // Function to get link for individual items
  const getItemLink = (item) => {
    if (!item || !item.id) return linkTo;
    
    switch(type) {
      case 'expeditions':
        return `/eksormisi/${item.id}`;
      case 'schools':
        return `/school/${item.id}`;
      case 'athletes':
        return `/athlites/${item.id}`;
      case 'bookings':
      default:
        return linkTo;
    }
  };

  return (
    <div style={{ 
      flex: '1 1 23%', // Use approximately a quarter of the space, allowing for some gap
      minWidth: '240px', // Minimum width to ensure readability
      backgroundColor: 'white', 
      padding: '12px',
      borderRadius: '5px', 
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      height: '180px', // Reduced height since we're showing fewer items
      overflow: 'hidden' // Prevent overflow issues
    }}>
      <h3 style={{ color: '#444', marginBottom: '8px', fontSize: '1rem' }}>{title}</h3>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '10px' }}>
          Φόρτωση...
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '10px', color: '#666', fontSize: '0.9rem' }}>
          {emptyMessage}
        </div>
      ) : (
        <ul style={{ 
          listStyle: 'none', 
          padding: 0, 
          margin: 0, 
          flex: 1
        }}>
          {items.map((item, index) => (
            <li key={index} style={{ 
              padding: '6px 0',
              borderBottom: index < items.length - 1 ? '1px solid #eee' : 'none',
              fontSize: '0.9rem'
            }}>
              {/* Make name clickable for expedition and school types */}
              {(type === 'expeditions' || type === 'schools') ? (
                <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
                  <Link to={getItemLink(item)} style={{ color: '#1976d2', textDecoration: 'none' }}>
                    {item.name}
                  </Link>
                </div>
              ) : (
                <div style={{ 
                  fontWeight: 'bold',
                  marginBottom: '3px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {item.name}
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '0.85rem', 
                color: '#666'
              }}>
                <span style={{ flex: '0 0 auto', marginRight: '10px' }}>{item.date}</span>
                <span style={{ 
                  flex: '1',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'right'
                }}>
                  {item.info}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      <div style={{ textAlign: 'right', marginTop: '8px' }}>
        <Link to={linkTo} style={{ color: '#1976d2', fontSize: '0.85rem', textDecoration: 'none' }}>
          Περισσότερα →
        </Link>
      </div>
    </div>
  );
}

export default Home;