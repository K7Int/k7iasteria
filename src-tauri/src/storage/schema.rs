//! First-run seeding. Creates root "desktop" folders and a small set of
//! illustrative memories so the empty product does not feel empty.

use chrono::{Duration, Utc};
use serde_json::json;

use crate::domain::{Link, Memory, MemoryKind};

use super::{MemoryRepository, SqliteMemoryRepository};

pub async fn seed_sample_data(repo: &SqliteMemoryRepository) -> anyhow::Result<()> {
    if repo.has_root().await? {
        return Ok(());
    }

    let folders: &[(&str, &str, &str)] = &[
        ("books", "Books", "book"),
        ("movies", "Movies", "film"),
        ("trips", "Trips", "trip"),
        ("photos", "Photos", "photo"),
        ("journals", "Journals", "journal"),
        ("workouts", "Workouts", "log"),
        ("places", "Places", "place"),
        ("projects", "Projects", "project"),
    ];

    let now = Utc::now();
    let root_ids: Vec<String> = folders.iter().map(|(id, _, _)| id.to_string()).collect();
    for &(id, title, icon) in folders {
        let mut m = Memory::new(title, MemoryKind::Folder, None);
        m.id = id.to_string();
        m.icon = icon.to_string();
        m.color = Some(color_for(title));
        m.occurred_at = None;
        repo.upsert(&m).await?;
    }

    let books = root_ids[0].clone();
    let trips = root_ids[2].clone();
    let journals = root_ids[4].clone();
    let workouts = root_ids[5].clone();
    let places = root_ids[6].clone();

    let examples: Vec<Memory> = vec![
        sample(&books, "The Name of the Rose", MemoryKind::Log, &["fiction","history"],
            json!({"author":"Umberto Eco","year":1980,"isbn":"978-0151001274","rating":5})),
        sample(&books, "Gödel, Escher, Bach", MemoryKind::Log, &["nonfiction","math"],
            json!({"author":"Douglas Hofstadter","year":1979,"rating":4})),
        sample(&books, "Meditations", MemoryKind::Log, &["philosophy"],
            json!({"author":"Marcus Aurelius","year":180,"rating":5})),

        sample(&journals, "Berlin in winter", MemoryKind::Document, &["berlin","travel"],
            json!({"weather":"snow","mood":"contemplative"}))
            .with_content("Walked through Tiergarten. Café at Savignyplatz. Snow on the grate."),
        sample(&journals, "Notes from the desert", MemoryKind::Document, &["desert"],
            json!({"weather":"hot"}))
            .with_content("Long drive.Pale dunes stretching to nothing. Quiet evening."),

        sample(&trips, "Iceland 2022", MemoryKind::Folder, &["iceland","2022"],
            json!({"country":"Iceland","year":2022})),
        sample(&trips, "Morocco 2019", MemoryKind::Folder, &["morocco","2019"],
            json!({"country":"Morocco","year":2019})),
        sample(&trips, "Japan 2024", MemoryKind::Folder, &["japan","2024"],
            json!({"country":"Japan","year":2024})),

        sample(&workouts, "Morning run", MemoryKind::Log, &["run"],
            json!({"distance_km":7.4,"duration_min":42,"hr_avg":148})),
        sample(&workouts, "Strength", MemoryKind::Log, &["gym"],
            json!({"sets":18,"exercises":["squat","bench","row"]})),
        sample(&workouts, "Hike Skaftafell", MemoryKind::Log, &["hike","iceland"],
            json!({"distance_km":14.0,"ascent_m":520})),

        sample(&places, "Reykjavík", MemoryKind::Place, &["iceland","city"],
            json!({"lat":64.1466,"lon":-21.9426})),
        sample(&places, "Marrakech", MemoryKind::Place, &["morocco","city"],
            json!({"lat":31.6295,"lon":-7.9811})),
        sample(&places, "Tokyo", MemoryKind::Place, &["japan","city"],
            json!({"lat":35.6762,"lon":139.6503})),
    ];

    for mut m in examples {
        m.occurred_at = Some(now - Duration::days(fastrand_days(&m.id)));
        repo.upsert(&m).await?;
        if m.title.starts_with("Iceland") || m.title.starts_with("Hike Skaftafell") {
            let target = places.clone();
            let link = Link {
                id: uuid::Uuid::new_v4().to_string(),
                source_id: m.id.clone(),
                target_id: target,
                relation: "took_place_at".into(),
                created_at: Utc::now(),
            };
            repo.link(&link).await?;
        }
    }

    Ok(())
}

fn sample(parent: &str, title: &str, kind: MemoryKind, tags: &[&str], meta: serde_json::Value) -> Memory {
    let mut m = Memory::new(title, kind, Some(parent.to_string()));
    m.tags = tags.iter().map(|s| s.to_string()).collect();
    if let serde_json::Value::Object(map) = meta {
        for (k, v) in map {
            m.metadata.insert(k, v);
        }
    }
    m
}

trait WithContent {
    fn with_content(self, c: &str) -> Self;
}
impl WithContent for Memory {
    fn with_content(mut self, c: &str) -> Self {
        self.content = c.to_string();
        self
    }
}

fn fastrand_days(seed: &str) -> i64 {
    let mut h: u64 = 0xCBF29CE484222325;
    for b in seed.as_bytes() {
        h ^= *b as u64;
        h = h.wrapping_mul(0x100000001B3);
    }
    (h % 720) as i64
}

fn color_for(title: &str) -> String {
    let palette = ["#7b2d2d","#3f6b3a","#b07b2d","#2d4e7b","#6b3a7b","#3a6b6b"];
    let mut h: u64 = 0;
    for b in title.as_bytes() {
        h = h.wrapping_add(*b as u64 * 17);
    }
    palette[(h as usize) % palette.len()].to_string()
}
