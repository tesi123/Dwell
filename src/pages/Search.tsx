import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  CardMedia,
  CircularProgress
} from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../database/firebase';
import { Listing } from '../libraries/Listing';
import { useNavigate } from 'react-router-dom';

type SortField = 'bedrooms' | 'zipCode' | 'rating' | 'pricePerNight';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    address: '',
    zipCode: '',
    bedrooms: '',
    minRating: 0,
    city: ''  // Add new filter
  });
  const [sortBy, setSortBy] = useState<SortField>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch listings from Firebase
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const listingsCollection = collection(db, 'listings');
        const listingsSnapshot = await getDocs(listingsCollection);
        const listingsData = listingsSnapshot.docs.map(doc => {
          const data = doc.data();
          return new Listing(
            doc.id,
            data.name,
            data.description,
            data.images,
            data.rating,
            data.reviews,
            data.zipCode,
            data.address,
            data.landlordUid,
            data.reservations,
            data.bathrooms,
            data.bedrooms,
            data.pricePerNight
          );
        });
        setListings(listingsData);
        setFilteredListings(listingsData);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...listings];

    // Apply filters
    if (filters.address) {
      result = result.filter(listing => 
        listing.address.toString().toLowerCase().includes(filters.address.toLowerCase())
      );
    }
    if (filters.zipCode) {
      result = result.filter(listing => 
        listing.zipCode.includes(filters.zipCode)
      );
    }
    if (filters.bedrooms) {
      result = result.filter(listing => 
        listing.bedrooms === parseInt(filters.bedrooms)
      );
    }
    if (filters.minRating > 0) {
      result = result.filter(listing => 
        listing.rating >= filters.minRating
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredListings(result);
  }, [filters, listings, sortBy, sortOrder]);

  const handleFilterChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleRatingChange = (_: React.SyntheticEvent, newValue: number | null) => {
    setFilters(prev => ({
      ...prev,
      minRating: newValue || 0
    }));
  };

  const navigateToListing = (listingId: string) => {
    navigate(`/listing/${listingId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Address"
              value={filters.address}
              onChange={handleFilterChange('address')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Zip Code"
              value={filters.zipCode}
              onChange={handleFilterChange('zipCode')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Bedrooms"
              type="number"
              value={filters.bedrooms}
              onChange={handleFilterChange('bedrooms')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography component="legend">Min Rating:</Typography>
              <Rating
                value={filters.minRating}
                onChange={handleRatingChange}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value as SortField)}
              >
                <MenuItem value="bedrooms">Bedrooms</MenuItem>
                <MenuItem value="zipCode">Zip Code</MenuItem>
                <MenuItem value="rating">Rating</MenuItem>
                <MenuItem value="pricePerNight">Price</MenuItem>
              </Select>
            </FormControl>
            <Button
              onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Results */}
      <Grid container spacing={3}>
        {filteredListings.map((listing) => (
          <Grid item xs={12} sm={6} md={4} key={listing.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={listing.images[0]}
                alt={listing.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="div">
                  {listing.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {listing.description}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography component="span" variant="body2">
                    {listing.bedrooms} bed | ${listing.pricePerNight}/night
                  </Typography>
                  <Rating value={listing.rating} readOnly size="small" sx={{ ml: 1 }} />
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => navigateToListing(listing.id)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredListings.length === 0 && (
        <Typography variant="h6" textAlign="center" sx={{ mt: 4 }}>
          No listings found matching your criteria
        </Typography>
      )}
    </Box>
  );
};

export default Search;
