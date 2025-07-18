import { supabase } from '../lib/supabase'

// Save generation to history
export const saveGenerationHistory = async (generationData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('generation_history')
      .insert([{
        user_id: user.id,
        type: generationData.type,
        input: generationData.input,
        output: generationData.output,
        translated_prompt: generationData.translatedPrompt,
        explanation: generationData.explanation,
        language_code: generationData.languageCode
      }])
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error saving generation history:', error)
    return { data: null, error }
  }
}

// Get user's generation history
export const getGenerationHistory = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('generation_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching generation history:', error)
    return { data: null, error }
  }
}

// Update user profile
export const updateUserProfile = async (updates) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .upsert([{
        id: user.id,
        ...updates
      }])
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return { data: null, error }
  }
}

// Get user profile
export const getUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return { data: null, error }
  }
}