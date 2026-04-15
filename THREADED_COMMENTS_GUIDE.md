# Threaded Comments Feature - Implementation Guide

## 🎯 Overview
This document describes the complete implementation of Twitter-style threaded comments for the eduConnect platform.

## ✅ What's Implemented

### Backend (100% Complete)
Located in Laravel backend project:

**Database:**
- Migration: `add_parent_comment_id_to_post_comments_table`
- New column: `parent_comment_id` (nullable FK to post_comments.id)

**Model: `PostComment` (app/Models/PostComment.php)**
```php
// Recursive relationships
public function parentComment() 
public function replies() // Has many child comments
public function post()
public function user()
```

**Controller: `PostController` (app/Http/Controllers/Api/PostController.php)**
- `getComments($postId)` - Returns hierarchical comments with nested replies
- `addComment($postId)` - Creates comment or reply (accepts parent_comment_id)
- `updateComment($postId, $commentId)` - Edit comment (owner only)
- `deleteComment($postId, $commentId)` - Delete comment (owner/admin only)

### Frontend (100% Complete)
Located in React frontend project: `src/pages/Dashboard.jsx`

**State Management:**
```javascript
const [replyingToCommentId, setReplyingToCommentId] = useState(null)
const [replyText, setReplyText] = useState('')
const [submittingReply, setSubmittingReply] = useState(false)
const [postComments, setPostComments] = useState({}) // Hierarchical structure
```

**Functions:**

1. **`renderComment(comment, depth = 0)`** - Recursive comment renderer
   - Displays comment with indentation based on nesting depth
   - Shows reply button (limited to depth < 2 to prevent infinite nesting)
   - Displays inline reply input when replying
   - Recursively renders nested replies
   - Supports edit/delete for comment owners

2. **`handleReplyComment(postId, parentCommentId)`** - Submit reply
   - Validates reply text
   - Calls API with parent_comment_id
   - Updates UI immediately
   - Clears reply input after submission

3. **`handleLoadComments(postId)`** - Fetch hierarchical comments
   - Loads comments with nested structure from backend
   - Caches comments to avoid re-fetching

### UI Components

**Collapsible Comment Input:**
- Small pill-shaped input by default
- Expands on focus/typing to show textarea
- Shows save/cancel buttons when expanded
- Used for creating main comments

**Reply Input Fields:**
- Appears inline when "Responder" button clicked
- Positioned directly under parent comment
- Shows save/cancel buttons
- Automatically hides after submission

**Comment Display:**
- Avatar (10x10 for root, 8x8 for nested)
- Author name and timestamp
- Edit/Delete buttons (owner only)
- Comment text
- "Responder" button (limited to 2 levels deep)
- Nested replies indented with left margin and border

## 🚀 How to Test

### 1. Create Main Comment
```
1. Go to Dashboard
2. Click comment icon on any post
3. Type comment in small input field
4. It expands to show textarea + buttons
5. Click ✓ to save
6. Comment appears in list immediately
```

### 2. Create Reply (First Level)
```
1. Hover over any comment
2. Click "Responder" button
3. Small reply input appears below comment
4. Type response text
5. Click ✓ to save
6. Reply appears indented under parent comment
```

### 3. Create Reply to Reply (Second Level)
```
1. Hover over a reply (first-level nested comment)
2. Click "Responder" button
3. Reply input appears
4. Type response
5. Click ✓ to save
6. Reply appears double-indented (2-level nesting)
```

### 4. Edit Comment/Reply
```
1. Hover over your own comment
2. Click ✏️ button
3. Textarea appears with current text
4. Edit text
5. Click "Guardar" to save or "Cancelar" to discard
6. Comment updates immediately
```

### 5. Delete Comment/Reply
```
1. Hover over your own comment
2. Click 🗑️ button
3. Comment is deleted immediately
4. Warning: Deleting parent removes replies too (cascading delete)
```

### 6. Test in Dark Mode
```
1. Click theme toggle in Navbar
2. Comments should display properly in dark theme
3. Colors should adjust for visibility
4. Borders and backgrounds should be visible
```

## 📊 Data Flow

### Creating a Reply
```
Frontend: Click "Responder" button on comment
   ↓
Frontend: User types in reply input (replyText state)
   ↓
Frontend: Click ✓ button
   ↓
Frontend: handleReplyComment() called
   ↓
Service: postsService.commentPost(postId, replyText, parentCommentId)
   ↓
Backend: POST /api/posts/{id}/comments with {comment, parent_comment_id}
   ↓
Backend: Create PostComment with parent_comment_id set
   ↓
Backend: Return new comment with replies array (empty for new reply)
   ↓
Frontend: Update postComments[postId] to include new reply under parent
   ↓
Frontend: renderComment() recursively displays updated structure
```

### Loading Comments
```
Frontend: User clicks comment icon on post
   ↓
Frontend: handleLoadComments(postId) called
   ↓
Service: postsService.getComments(postId)
   ↓
Backend: GET /api/posts/{id}/comments
   ↓
Backend: Select all root comments (parent_comment_id IS NULL)
         with eager-loaded replies relationship (recursive)
   ↓
Backend: Return array of comments with nested replies structure:
         [{
           id: 1,
           comment: "...",
           replies: [
             { id: 2, comment: "...", replies: [...] },
             { id: 3, comment: "...", replies: [...] }
           ]
         }, ...]
   ↓
Frontend: Store in postComments[postId]
   ↓
Frontend: renderComment() called on each root comment
         which recursively renders replies
```

## 🎨 Visual Structure

```
Comment Modal
├── Post Preview
├── Comment Input (collapsible pill)
└── Comments List
    ├── Root Comment 1
    │   ├── Edit / Delete buttons
    │   ├── Responder button
    │   └── Nested Replies (if any)
    │       ├── Reply 1 (indented)
    │       │   ├── Edit / Delete buttons
    │       │   ├── Responder button
    │       │   └── Nested Replies (if any)
    │       │       └── Reply 1.1 (double-indented)
    │       └── Reply 2 (indented)
    ├── Root Comment 2
    └── Root Comment 3
```

## ⚙️ Configuration

### Max Nesting Depth (UI Limited)
- Backend: Unlimited recursion supported
- Frontend: "Responder" button hidden at depth >= 2
- This prevents the UI from becoming too nested

To change max depth, edit line in `renderComment()`:
```javascript
{depth < 2 && (  // Change 2 to desired max depth
  <button onClick={() => setReplyingToCommentId(comment.id)}>
    Responder
  </button>
)}
```

### Avatar Sizing
- Root comments: `w-10 h-10`
- Nested comments: `w-8 h-8`

To adjust, modify CSS classes in `renderComment()`:
```javascript
className={`${depth > 0 ? 'w-8 h-8' : 'w-10 h-10'} ...`}
```

### Indentation Spacing
- Left margin: `ml-6` (24px)
- Left padding: `pl-3` (12px)
- Left border for visual indication

To adjust, modify CSS classes in `renderComment()`:
```javascript
className={`... ${depth > 0 ? 'ml-6 pl-3 border-l-2 ...' : ''}`}
```

## 🐛 Troubleshooting

### Comments not appearing
1. Check browser console for errors
2. Verify backend is returning hierarchical structure
3. Check that `renderComment()` function is being called
4. Ensure `postComments` state is being updated

### Replies not appearing under parent
1. Check that backend returns `replies` array in comments structure
2. Verify `renderComment()` recursively renders `comment.replies`
3. Check that `replyingToCommentId` is being set correctly

### Edit/Delete buttons not showing
1. Verify `user?.id` matches `comment.user_id` (check types - should be numbers)
2. Check authorization in backend (owner or admin)
3. Inspect element to see if button is rendered but hidden

### Styling issues
1. Check dark mode classes are being applied correctly
2. Verify Tailwind is processing nested classNames
3. Check for conflicts with existing styles

## 📝 API Endpoints Used

**Get Comments:**
```
GET /api/posts/{postId}/comments
Response: Array of comments with nested replies structure
```

**Create Comment:**
```
POST /api/posts/{postId}/comments
Body: { comment: "text", parent_comment_id?: integer }
Response: New comment object
```

**Update Comment:**
```
PUT /api/posts/{postId}/comments/{commentId}
Body: { comment: "updated text" }
Response: Updated comment object
```

**Delete Comment:**
```
DELETE /api/posts/{postId}/comments/{commentId}
Response: 200 OK or 204 No Content
```

## 🎓 Code Examples

### Display Hierarchy
```jsx
{comments.map((comment) => renderComment(comment))}
```

### Handle Reply Submission
```jsx
const handleReplyComment = async (postId, parentCommentId) => {
  const result = await postsService.commentPost(
    postId, 
    replyText, 
    parentCommentId
  )
  // Update state to show new reply immediately
  setPostComments(prev => ({
    ...prev,
    [postId]: prev[postId].map(c => {
      if (c.id === parentCommentId) {
        return { ...c, replies: [...(c.replies || []), result] }
      }
      return c
    })
  }))
}
```

## ✨ Features Completed

- ✅ Hierarchical comment structure with parent/child relationships
- ✅ Recursive rendering with indentation
- ✅ Reply functionality at any level
- ✅ Inline reply inputs
- ✅ Edit comments (owner only)
- ✅ Delete comments (owner/admin)
- ✅ Comment counters (main comments only)
- ✅ Collapsible comment input
- ✅ Dark mode support
- ✅ Real-time UI updates
- ✅ Error handling

## 🚀 Next Steps

- [ ] Add comment reactions/emojis
- [ ] Add mention system (@username)
- [ ] Add comment sorting/filtering
- [ ] Add pagination for large comment threads
- [ ] Add comment moderation tools
- [ ] Add notification for replies

---

**Last Updated:** 2024  
**Status:** Production Ready  
**Testing:** Ready for QA
