# Sample Restaurant Data

The repository includes an idempotent sample-data script at `backend/scripts/seed-sample-data.js`.

## Run the Seeder

Set `MONGO_URI` in `backend/.env`, then run:

```bash
npm run seed:sample --prefix backend
```

The script upserts records, so running it more than once updates the same sample partner, restaurants, and dishes instead of creating duplicates.

## Sample Partner

Default development credentials:

```text
Email: sample.partner@munchy.local
Password: SamplePartner123!
```

Override them before seeding:

```env
SEED_PARTNER_EMAIL=another.sample@example.com
SEED_PARTNER_PASSWORD=UseAnotherStrongPassword123!
```

The seeded partner is verified and active. Change the default credentials in any shared or publicly accessible environment.

## Restaurants

All seeded names deliberately contain `(Sample)`:

| Restaurant | Location | Cuisine | Menu |
| --- | --- | --- | --- |
| Spice Route Kitchen (Sample) | Indiranagar, Bengaluru | North Indian, biryani, street food | Paneer Tikka Bowl, Butter Chicken Combo, Veg Dum Biryani, Masala Chai |
| Green Bowl Cafe (Sample) | Koramangala, Bengaluru | Healthy, cafe, continental | Protein Power Bowl, Avocado Toast, Mediterranean Salad, Berry Smoothie |
| Midnight Bites (Sample) | HSR Layout, Bengaluru | Fast food, pizza, desserts | Classic Smash Burger, Margherita Pizza, Loaded Masala Fries, Chocolate Brownie Sundae |

Each menu item also ends with `(Sample)`. The data includes prices, categories, vegetarian flags, descriptions, ratings, availability, store coordinates, opening hours, and remote demonstration images.

## Production Guard

The script refuses to seed when `NODE_ENV=production`. To intentionally seed a demo production environment, set:

```env
ALLOW_PRODUCTION_SEED=true
```

Do not enable this variable permanently. The script never deletes real records, but production sample data should still be an explicit decision.

## Removing Sample Data

Sample records can be identified by names ending in `(Sample)` and by the configured sample partner email. Remove them through MongoDB tooling or the partner application after confirming that no demonstration orders reference them.
