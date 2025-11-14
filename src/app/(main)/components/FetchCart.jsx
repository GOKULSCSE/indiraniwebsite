"use client"
import { useCartStore } from '@/store/cartStore'
import { useSession } from 'next-auth/react'
import React, { useEffect } from 'react'

function FetchCart() {
    const { fetchCart } = useCartStore()
    const { data: session } = useSession()

    useEffect(() => {
        if (session?.user?.id) {
            fetchCart(session.user.id)
        }
    }, [session, fetchCart])

    return null;
}

export default FetchCart
