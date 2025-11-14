"use client"
import { useWishlistStore } from '@/store/wishlistStore'
import { useSession } from 'next-auth/react'
import React, { useEffect } from 'react'

function FetchWishlists() {

    const { fetchWishlist } = useWishlistStore()
      const { data: session } = useSession()

    useEffect(() => {
        if (session?.user?.id) {
            fetchWishlist(session.user.id)
        }
    }, [session, fetchWishlist])


    return (
        null
    )
}

export default FetchWishlists