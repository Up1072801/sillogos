import React, { useState, useEffect } from "react";
import { 
  Container, Box, Typography, Paper, Button, TextField, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  Alert, Snackbar, CircularProgress, Grid
} from "@mui/material";
import api from '../utils/api';
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import SportsIcon from "@mui/icons-material/Sports";
import TerrainIcon from "@mui/icons-material/Terrain";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import CabinIcon from "@mui/icons-material/Cabin";

export default function AdminPage() {
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState({
    sports: false,
    difficulty: false,
    subscription: false,
    refuge: false
  });

  // State για τα δεδομένα από το API
  const [sports, setSports] = useState([]);
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [refugePrices, setRefugePrices] = useState([]);

  // State για διαλόγους
  const [sportDialog, setSportDialog] = useState({ open: false, data: null, isEdit: false });
  const [difficultyDialog, setDifficultyDialog] = useState({ open: false, data: null, isEdit: false });
  const [subscriptionDialog, setSubscriptionDialog] = useState({ open: false, data: null, isEdit: false });
  const [refugeDialog, setRefugeDialog] = useState({ open: false, data: null, isEdit: false });

  // Αρχική φόρτωση δεδομένων
  useEffect(() => {
    fetchSports();
    fetchDifficultyLevels();
    fetchSubscriptionTypes();
    fetchRefugePrices();
  }, []);

  // Φόρτωση αθλημάτων
  const fetchSports = async () => {
    try {
      setLoading(prev => ({ ...prev, sports: true }));
      const response = await api.get("/athlites/sports-list");
      setSports(response.data);
    } catch (error) {
      console.error("Σφάλμα κατά τη φόρτωση αθλημάτων:", error);
      showNotification("Σφάλμα κατά τη φόρτωση αθλημάτων", "error");
    } finally {
      setLoading(prev => ({ ...prev, sports: false }));
    }
  };

  // Φόρτωση βαθμών δυσκολίας
  const fetchDifficultyLevels = async () => {
    try {
      setLoading(prev => ({ ...prev, difficulty: true }));
      const response = await api.get("/vathmoi-diskolias");
      setDifficultyLevels(response.data);
    } catch (error) {
      console.error("Σφάλμα κατά τη φόρτωση βαθμών δυσκολίας:", error);
      showNotification("Σφάλμα κατά τη φόρτωση βαθμών δυσκολίας", "error");
    } finally {
      setLoading(prev => ({ ...prev, difficulty: false }));
    }
  };

  // Φόρτωση ειδών συνδρομής
  const fetchSubscriptionTypes = async () => {
    try {
      setLoading(prev => ({ ...prev, subscription: true }));
      const response = await api.get("/eidi-sindromis");
      setSubscriptionTypes(response.data);
    } catch (error) {
      console.error("Σφάλμα κατά τη φόρτωση ειδών συνδρομής:", error);
      showNotification("Σφάλμα κατά τη φόρτωση ειδών συνδρομής", "error");
    } finally {
      setLoading(prev => ({ ...prev, subscription: false }));
    }
  };

  // Φόρτωση τιμών καταφυγίου
  const fetchRefugePrices = async () => {
    try {
      setLoading(prev => ({ ...prev, refuge: true }));
      const response = await api.get("/katafigio/katafygia");
      setRefugePrices(response.data);
    } catch (error) {
      console.error("Σφάλμα κατά τη φόρτωση τιμών καταφυγίου:", error);
      showNotification("Σφάλμα κατά τη φόρτωση τιμών καταφυγίου", "error");
    } finally {
      setLoading(prev => ({ ...prev, refuge: false }));
    }
  };

  // Προβολή ενημέρωσης στον χρήστη
  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Υλοποίηση λειτουργιών CRUD για αθλήματα
  const handleAddSport = async () => {
    try {
      await api.post("/athlites/sport", { onoma: sportDialog.data.onoma });
      await fetchSports();
      setSportDialog({...sportDialog, open: false});
      showNotification("Το άθλημα προστέθηκε επιτυχώς");
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη αθλήματος:", error);
      showNotification("Σφάλμα κατά την προσθήκη αθλήματος", "error");
    }
  };

  const handleUpdateSport = async () => {
    try {
      await api.put(`/athlites/sport/${sportDialog.data.id_athlimatos}`, 
        { onoma: sportDialog.data.onoma }
      );
      await fetchSports();
      setSportDialog({...sportDialog, open: false});
      showNotification("Το άθλημα ενημερώθηκε επιτυχώς");
    } catch (error) {
      console.error("Σφάλμα κατά την ενημέρωση αθλήματος:", error);
      showNotification("Σφάλμα κατά την ενημέρωση αθλήματος", "error");
    }
  };

  // Υλοποίηση λειτουργιών CRUD για βαθμούς δυσκολίας
  const handleAddDifficulty = async () => {
    try {
      // Make sure epipedo is a valid number
      const epipedoValue = parseInt(difficultyDialog.data.epipedo);
      if (isNaN(epipedoValue)) {
        showNotification("Το επίπεδο πρέπει να είναι έγκυρος αριθμός", "error");
        return;
      }
      
      await api.post("/vathmoi-diskolias", { 
        epipedo: epipedoValue
      });
      await fetchDifficultyLevels();
      setDifficultyDialog({...difficultyDialog, open: false});
      showNotification("Ο βαθμός δυσκολίας προστέθηκε επιτυχώς");
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη βαθμού δυσκολίας:", error);
      showNotification("Σφάλμα κατά την προσθήκη βαθμού δυσκολίας", "error");
    }
  };

  const handleUpdateDifficulty = async () => {
    try {
      await api.put(`/vathmoi-diskolias/${difficultyDialog.data.id_vathmou_diskolias}`, { 
        epipedo: difficultyDialog.data.epipedo 
      });
      await fetchDifficultyLevels();
      setDifficultyDialog({...difficultyDialog, open: false});
      showNotification("Ο βαθμός δυσκολίας ενημερώθηκε επιτυχώς");
    } catch (error) {
      console.error("Σφάλμα κατά την ενημέρωση βαθμού δυσκολίας:", error);
      showNotification("Σφάλμα κατά την ενημέρωση βαθμού δυσκολίας", "error");
    }
  };

  // Υλοποίηση λειτουργιών CRUD για είδη συνδρομής
  const handleAddSubscription = async () => {
    try {
      const data = {
        typos: subscriptionDialog.data.titlos, // Changed from titlos to typos
        kostos: parseInt(subscriptionDialog.data.kostos) || 0  // Ensure it's a number
      };
      await api.post("/eidi-sindromis", data);
      await fetchSubscriptionTypes();
      setSubscriptionDialog({...subscriptionDialog, open: false});
      showNotification("Το είδος συνδρομής προστέθηκε επιτυχώς");
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη είδους συνδρομής:", error);
      showNotification("Σφάλμα κατά την προσθήκη είδους συνδρομής", "error");
    }
  };

  const handleUpdateSubscription = async () => {
    try {
      // Make sure we have a valid ID
      if (!subscriptionDialog.data.id_eidous) {
        showNotification("Δεν βρέθηκε έγκυρο ID είδους συνδρομής", "error");
        return;
      }
      
      const data = {
        typos: subscriptionDialog.data.titlos, // Changed from titlos to typos
        kostos: parseInt(subscriptionDialog.data.kostos) || 0
      };
      await api.put(`/eidi-sindromis/${subscriptionDialog.data.id_eidous}`, data);
      await fetchSubscriptionTypes();
      setSubscriptionDialog({...subscriptionDialog, open: false});
      showNotification("Το είδος συνδρομής ενημερώθηκε επιτυχώς");
    } catch (error) {
      console.error("Σφάλμα κατά την ενημέρωση είδους συνδρομής:", error);
      showNotification("Σφάλμα κατά την ενημέρωση είδους συνδρομής", "error");
    }
  };

  // Υλοποίηση λειτουργιών CRUD για καταφύγια
  const handleAddRefuge = async () => {
    try {
      // Validate required fields
      if (!refugeDialog.data.onoma) {
        showNotification("Το όνομα καταφυγίου είναι υποχρεωτικό", "error");
        return;
      }
      
      const formattedData = {
        onoma: refugeDialog.data.onoma,
        xoritikotita: parseInt(refugeDialog.data.xoritikotita) || 0,
        timi_melous: parseInt(refugeDialog.data.timi_melous) || 0,
        timi_mi_melous: parseInt(refugeDialog.data.timi_mi_melous) || 0,
        timi_eksoxwrou_melos: parseInt(refugeDialog.data.timi_eksoxwrou_melos) || 0,
        timi_eksoxwroy_mimelos: parseInt(refugeDialog.data.timi_eksoxwroy_mimelos) || 0
      };
      
      await api.post("/katafigio/katafygia", formattedData);
      await fetchRefugePrices();
      setRefugeDialog({...refugeDialog, open: false});
      showNotification("Το καταφύγιο προστέθηκε επιτυχώς");
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη καταφυγίου:", error);
      showNotification("Σφάλμα κατά την προσθήκη καταφυγίου", "error");
    }
  };

  const handleUpdateRefuge = async () => {
    try {
      await api.put(`/katafigio/katafygia/${refugeDialog.data.id_katafigiou}`, 
        refugeDialog.data
      );
      await fetchRefugePrices();
      setRefugeDialog({...refugeDialog, open: false});
      showNotification("Το καταφύγιο ενημερώθηκε επιτυχώς");
    } catch (error) {
      console.error("Σφάλμα κατά την ενημέρωση καταφυγίου:", error);
      showNotification("Σφάλμα κατά την ενημέρωση καταφυγίου", "error");
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Διαχείριση Παραμέτρων Συστήματος
        </Typography>

        <Grid container spacing={3}>
          {/* ΑΘΛΗΜΑΤΑ */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3, borderTop: 5, borderColor: 'primary.main' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SportsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
                <Typography variant="h5" component="h2">
                  Αθλήματα
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  onClick={() => setSportDialog({ open: true, data: { onoma: "" }, isEdit: false })}
                >
                  Προσθήκη Νέου Αθλήματος
                </Button>
              </Box>
              
              {loading.sports ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Όνομα Αθλήματος</TableCell>
                        <TableCell align="right">Ενέργειες</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sports.map((sport) => (
                        <TableRow key={sport.id_athlimatos}>
                          <TableCell>{sport.onoma}</TableCell>
                          <TableCell align="right">
                            <IconButton 
                              color="primary" 
                              onClick={() => setSportDialog({ open: true, data: {...sport}, isEdit: true })}
                            >
                              <EditIcon />
                            </IconButton>
                            {/* Αφαιρούμε το κουμπί διαγραφής */}
                          </TableCell>
                        </TableRow>
                      ))}
                      {sports.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} align="center">
                            Δεν υπάρχουν καταχωρημένα αθλήματα
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>

          {/* ΒΑΘΜΟΙ ΔΥΣΚΟΛΙΑΣ */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3, borderTop: 5, borderColor: 'success.main' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TerrainIcon sx={{ fontSize: 32, mr: 2, color: 'success.main' }} />
                <Typography variant="h5" component="h2">
                  Βαθμοί Δυσκολίας
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button 
                  variant="contained" 
                  color="success"
                  startIcon={<AddIcon />} 
                  onClick={() => setDifficultyDialog({ open: true, data: { epipedo: "" }, isEdit: false })}
                >
                  Προσθήκη Νέου Βαθμού
                </Button>
              </Box>
              
              {loading.difficulty ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress color="success" />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Επίπεδο</TableCell>
                        <TableCell align="right">Ενέργειες</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {difficultyLevels.map((level) => (
                        <TableRow key={level.id_vathmou_diskolias}>
                          <TableCell>{level.epipedo}</TableCell>
                          <TableCell align="right">
                            <IconButton 
                              color="primary" 
                              onClick={() => setDifficultyDialog({ open: true, data: {...level}, isEdit: true })}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              color="error"
                              onClick={() => handleDeleteDifficulty(level.id_vathmou_diskolias)}
                            >

                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {difficultyLevels.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} align="center">
                            Δεν υπάρχουν καταχωρημένοι βαθμοί δυσκολίας
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>

          {/* ΕΙΔΗ ΣΥΝΔΡΟΜΗΣ */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3, borderTop: 5, borderColor: 'info.main' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CardMembershipIcon sx={{ fontSize: 32, mr: 2, color: 'info.main' }} />
                <Typography variant="h5" component="h2">
                  Είδη Συνδρομής
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button 
                  variant="contained" 
                  color="info"
                  startIcon={<AddIcon />} 
                  onClick={() => setSubscriptionDialog({ open: true, data: { titlos: "", kostos: 0 }, isEdit: false })}
                >
                  Προσθήκη Είδους Συνδρομής
                </Button>
              </Box>
              
              {loading.subscription ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress color="info" />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Τύπος Συνδρομής</TableCell>
                        <TableCell>Κόστος</TableCell>
                        <TableCell align="right">Ενέργειες</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subscriptionTypes.map((subscription) => {
                        // Make sure we have a valid ID by checking all possible field names
                        const subscriptionId = subscription.id_eidous_sindromis || subscription.id_eidous || subscription.id;
                        
                        return (
                          <TableRow key={subscriptionId}>
                            <TableCell>{subscription.typos || subscription.titlos}</TableCell>
                            <TableCell>{subscription.kostos || subscription.timi}€</TableCell>
                            <TableCell align="right">
                              <IconButton 
                                color="primary" 
                                onClick={() => setSubscriptionDialog({ 
                                  open: true, 
                                  data: {
                                    id_eidous: subscriptionId,
                                    titlos: subscription.typos || subscription.titlos,
                                    kostos: subscription.kostos || subscription.timi
                                  }, 
                                  isEdit: true 
                                })}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton 
                                color="error"
                                onClick={() => handleDeleteSubscription(subscriptionId)}
                              >
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {subscriptionTypes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            Δεν υπάρχουν καταχωρημένα είδη συνδρομής
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>

          {/* ΚΑΤΑΦΥΓΙΑ */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3, borderTop: 5, borderColor: 'warning.main' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CabinIcon sx={{ fontSize: 32, mr: 2, color: 'warning.main' }} />
                <Typography variant="h5" component="h2">
                  Καταφύγια
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button 
                  variant="contained" 
                  color="warning"
                  startIcon={<AddIcon />} 
                  onClick={() => setRefugeDialog({
                    open: true, 
                    data: { onoma: "", xoritikotita: 0, timi_melous: 0, timi_mi_melous: 0 }, 
                    isEdit: false 
                  })}
                >
                  Προσθήκη Νέου Καταφυγίου
                </Button>
              </Box>
              
              {loading.refuge ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress color="warning" />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Όνομα</TableCell>
                        <TableCell>Χωρητικότητα</TableCell>
                        <TableCell>Τιμή Μέλους (Εσωτ.)</TableCell>
                        <TableCell>Τιμή Μη Μέλους (Εσωτ.)</TableCell>
                        <TableCell>Τιμή Μέλους (Εξωτ.)</TableCell>
                        <TableCell>Τιμή Μη Μέλους (Εξωτ.)</TableCell>
                        <TableCell align="right">Ενέργειες</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {refugePrices.map((refuge) => (
                        <TableRow key={refuge.id_katafigiou}>
                          <TableCell>{refuge.onoma}</TableCell>
                          <TableCell>{refuge.xoritikotita}</TableCell>
                          <TableCell>{refuge.timi_melous}€</TableCell>
                          <TableCell>{refuge.timi_mi_melous}€</TableCell>
                          <TableCell>{refuge.timi_eksoxwrou_melos || 0}€</TableCell>
                          <TableCell>{refuge.timi_eksoxwroy_mimelos || 0}€</TableCell>
                          <TableCell align="right">
                            <IconButton 
                              color="primary" 
                              onClick={() => setRefugeDialog({ open: true, data: {...refuge}, isEdit: true })}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              color="error"
                              onClick={() => handleDeleteRefuge(refuge.id_katafigiou)}
                            >
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {refugePrices.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            Δεν υπάρχουν καταχωρημένα καταφύγια
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Dialog για προσθήκη/επεξεργασία αθλήματος */}
        <Dialog open={sportDialog.open} onClose={() => setSportDialog({...sportDialog, open: false})}>
          <DialogTitle>{sportDialog.isEdit ? "Επεξεργασία" : "Προσθήκη"} Αθλήματος</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Όνομα Αθλήματος"
              fullWidth
              value={sportDialog.data?.onoma || ""}
              onChange={(e) => setSportDialog({...sportDialog, data: {...sportDialog.data, onoma: e.target.value}})}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSportDialog({...sportDialog, open: false})}>Ακύρωση</Button>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={() => sportDialog.isEdit ? handleUpdateSport() : handleAddSport()}
            >
              Αποθήκευση
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog για προσθήκη/επεξεργασία βαθμού δυσκολίας */}
        <Dialog open={difficultyDialog.open} onClose={() => setDifficultyDialog({...difficultyDialog, open: false})}>
          <DialogTitle>{difficultyDialog.isEdit ? "Επεξεργασία" : "Προσθήκη"} Βαθμού Δυσκολίας</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Επίπεδο"
              type="number"
              fullWidth
              value={difficultyDialog.data?.epipedo || ""}
              onChange={(e) => setDifficultyDialog({...difficultyDialog, data: {...difficultyDialog.data, epipedo: parseInt(e.target.value)}})}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDifficultyDialog({...difficultyDialog, open: false})}>Ακύρωση</Button>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={() => difficultyDialog.isEdit ? handleUpdateDifficulty() : handleAddDifficulty()}
            >
              Αποθήκευση
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog για προσθήκη/επεξεργασία είδους συνδρομής */}
        <Dialog open={subscriptionDialog.open} onClose={() => setSubscriptionDialog({...subscriptionDialog, open: false})}>
          <DialogTitle>{subscriptionDialog.isEdit ? "Επεξεργασία" : "Προσθήκη"} Είδους Συνδρομής</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Τύπος Συνδρομής"
              fullWidth
              value={subscriptionDialog.data?.titlos || ""}
              onChange={(e) => setSubscriptionDialog({...subscriptionDialog, data: {...subscriptionDialog.data, titlos: e.target.value}})}
            />
            <TextField
              margin="dense"
              label="Κόστος"
              type="number"
              fullWidth
              value={subscriptionDialog.data?.kostos || 0}
              onChange={(e) => setSubscriptionDialog({...subscriptionDialog, data: {...subscriptionDialog.data, kostos: parseInt(e.target.value)}})}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSubscriptionDialog({...subscriptionDialog, open: false})}>Ακύρωση</Button>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={() => subscriptionDialog.isEdit ? handleUpdateSubscription() : handleAddSubscription()}
            >
              Αποθήκευση
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog για προσθήκη/επεξεργασία καταφυγίου */}
        <Dialog open={refugeDialog.open} onClose={() => setRefugeDialog({...refugeDialog, open: false})}>
          <DialogTitle>{refugeDialog.isEdit ? "Επεξεργασία" : "Προσθήκη"} Καταφυγίου</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Όνομα Καταφυγίου"
              fullWidth
              value={refugeDialog.data?.onoma || ""}
              onChange={(e) => setRefugeDialog({...refugeDialog, data: {...refugeDialog.data, onoma: e.target.value}})}
            />
            <TextField
              margin="dense"
              label="Χωρητικότητα"
              type="number"
              fullWidth
              value={refugeDialog.data?.xoritikotita || 0}
              onChange={(e) => setRefugeDialog({...refugeDialog, data: {...refugeDialog.data, xoritikotita: parseInt(e.target.value)}})}
            />
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Τιμές Εσωτερικού Χώρου</Typography>
            <TextField
              margin="dense"
              label="Τιμή Μέλους (Εσωτερικός χώρος)"
              type="number"
              fullWidth
              value={refugeDialog.data?.timi_melous || 0}
              onChange={(e) => setRefugeDialog({...refugeDialog, data: {...refugeDialog.data, timi_melous: parseInt(e.target.value)}})}
            />
            <TextField
              margin="dense"
              label="Τιμή Μη Μέλους (Εσωτερικός χώρος)"
              type="number"
              fullWidth
              value={refugeDialog.data?.timi_mi_melous || 0}
              onChange={(e) => setRefugeDialog({...refugeDialog, data: {...refugeDialog.data, timi_mi_melous: parseInt(e.target.value)}})}
            />
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Τιμές Εξωτερικού Χώρου</Typography>
            <TextField
              margin="dense"
              label="Τιμή Μέλους (Εξωτερικός χώρος)"
              type="number"
              fullWidth
              value={refugeDialog.data?.timi_eksoxwrou_melos || 0}
              onChange={(e) => setRefugeDialog({...refugeDialog, data: {...refugeDialog.data, timi_eksoxwrou_melos: parseInt(e.target.value)}})}
            />
            <TextField
              margin="dense"
              label="Τιμή Μη Μέλους (Εξωτερικός χώρος)"
              type="number"
              fullWidth
              value={refugeDialog.data?.timi_eksoxwroy_mimelos || 0}
              onChange={(e) => setRefugeDialog({...refugeDialog, data: {...refugeDialog.data, timi_eksoxwroy_mimelos: parseInt(e.target.value)}})}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRefugeDialog({...refugeDialog, open: false})}>Ακύρωση</Button>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={() => refugeDialog.isEdit ? handleUpdateRefuge() : handleAddRefuge()}
            >
              Αποθήκευση
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Snackbar για ενημερώσεις */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}