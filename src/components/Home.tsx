import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

interface Post {
  id: string;
  text: string;
  imageUrl: string;
  userId: string;
}

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const newPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      setPosts(newPosts);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="home p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Home Feed</h1>
      <div className="max-w-2xl mx-auto">
        {posts.map((post) => (
          <div
            key={post.id}
            className="post bg-white shadow-md rounded-lg p-4 mb-4"
          >
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Post"
                className="w-full h-64 object-cover rounded-lg mb-2"
              />
            )}
            <p className="text-gray-800">{post.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
